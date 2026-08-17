import { buildRealtimeInstructions } from '../ai/openai/realtimePrompt';
import { toRealtimeTools } from '../ai/openai/realtimeTools';
import type { LanguageCode } from '../types';

export interface RealtimeFunctionCall {
  callId: string;
  name: string;
  arguments: string;
}

export interface RealtimeHandlers {
  onState: (state: RealtimeUiState) => void;
  onUserTranscript: (text: string, final: boolean) => void;
  onAssistantTranscript: (text: string, final: boolean) => void;
  onFunctionCalls: (calls: RealtimeFunctionCall[]) => Promise<void>;
  onError: (message: string) => void;
  onEvent?: (type: string) => void;
}

export type RealtimeUiState =
  | 'connecting'
  | 'ready'
  | 'user_speaking'
  | 'processing'
  | 'assistant_speaking'
  | 'disconnected'
  | 'error';

export function isRealtimeSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof RTCPeerConnection !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export class RealtimeVoiceClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sender: RTCRtpSender | null = null;
  private language: LanguageCode = 'en';
  private handlers: RealtimeHandlers;
  private userPartial = '';
  private assistantPartial = '';
  private handledCalls = new Set<string>();
  private closed = false;
  private executing = false;

  constructor(handlers: RealtimeHandlers) {
    this.handlers = handlers;
  }

  isConnected() {
    return this.pc?.connectionState === 'connected' && this.dc?.readyState === 'open';
  }

  setExecuting(value: boolean) {
    this.executing = value;
  }

  setMicEnabled(enabled: boolean) {
    this.mic?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    if (this.sender?.track) this.sender.track.enabled = enabled;
  }

  async connect(language: LanguageCode) {
    this.language = language;
    this.closed = false;
    this.handlers.onState('connecting');

    const tokenResponse = await fetch('/api/realtime/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    });
    const tokenData = (await tokenResponse.json()) as { value?: string; error?: string };
    if (!tokenResponse.ok || !tokenData.value) {
      throw new Error(tokenData.error || 'Could not start a Realtime voice session.');
    }

    const pc = new RTCPeerConnection();
    this.pc = pc;

    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', 'true');
    this.audioEl = audioEl;
    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
      void audioEl.play().catch(() => undefined);
    };

    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.mic = mic;
    const track = mic.getAudioTracks()[0];
    if (track) this.sender = pc.addTrack(track, mic);

    const dc = pc.createDataChannel('oai-events');
    this.dc = dc;
    dc.addEventListener('message', (event) => this.handleServerEvent(event.data));

    pc.onconnectionstatechange = () => {
      if (this.closed) return;
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handlers.onState('disconnected');
        this.handlers.onError('The voice connection dropped. Try enabling listening again.');
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);

    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: pc.localDescription?.sdp ?? offer.sdp,
      headers: {
        Authorization: `Bearer ${tokenData.value}`,
        'Content-Type': 'application/sdp',
      },
    });
    const answerSdp = await sdpResponse.text();
    if (!sdpResponse.ok) {
      throw new Error(answerSdp.slice(0, 180) || 'WebRTC handshake failed.');
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    await waitForDataChannel(dc);
    this.configureSession();
    this.handlers.onState('ready');
  }

  sendUserText(text: string) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    this.send({
      type: 'response.create',
      response: {
        output_modalities: ['audio'],
      },
    });
  }

  seedHistory(messages: Array<{ role: string; content: string | null }>) {
    for (const message of messages) {
      if (!message.content) continue;
      if (message.role !== 'user' && message.role !== 'assistant') continue;
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: message.role,
          content: [
            {
              type: message.role === 'user' ? 'input_text' : 'text',
              text: message.content,
            },
          ],
        },
      });
    }
  }

  returnToolResult(callId: string, output: unknown) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: typeof output === 'string' ? output : JSON.stringify(output),
      },
    });
  }

  requestResponse() {
    this.send({ type: 'response.create' });
  }

  cancelResponse() {
    this.send({ type: 'response.cancel' });
  }

  updateLanguage(language: LanguageCode) {
    this.language = language;
    this.configureSession();
  }

  disconnect() {
    this.closed = true;
    this.cancelResponse();
    this.dc?.close();
    this.pc?.getSenders().forEach((sender) => sender.track?.stop());
    this.mic?.getTracks().forEach((track) => track.stop());
    this.pc?.close();
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl.remove();
    }
    this.pc = null;
    this.dc = null;
    this.mic = null;
    this.audioEl = null;
    this.sender = null;
    this.handlers.onState('disconnected');
  }

  private configureSession() {
    this.send({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: buildRealtimeInstructions(this.language),
        output_modalities: ['audio'],
        tools: toRealtimeTools(),
        tool_choice: 'auto',
        audio: {
          input: {
            transcription: { model: 'gpt-4o-transcribe' },
            turn_detection: {
              type: 'semantic_vad',
              eagerness: 'medium',
              create_response: true,
              interrupt_response: true,
            },
          },
        },
      },
    });
  }

  private send(payload: Record<string, unknown>) {
    if (this.dc?.readyState !== 'open') return;
    this.dc.send(JSON.stringify(payload));
  }

  private handleServerEvent(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    const type = String(event.type || '');
    this.handlers.onEvent?.(type);

    if (type === 'input_audio_buffer.speech_started') {
      this.userPartial = '';
      this.handlers.onState('user_speaking');
      return;
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      this.handlers.onState('processing');
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.delta') {
      const delta = String(event.delta ?? event.transcript ?? '');
      if (delta) {
        this.userPartial += delta;
        this.handlers.onUserTranscript(this.userPartial, false);
      }
      return;
    }
    if (
      type === 'conversation.item.input_audio_transcription.completed' ||
      type === 'conversation.item.input_audio_transcription.done'
    ) {
      const text = String(event.transcript ?? this.userPartial);
      this.userPartial = text;
      if (text) this.handlers.onUserTranscript(text, true);
      return;
    }
    if (
      type === 'response.output_audio_transcript.delta' ||
      type === 'response.audio_transcript.delta'
    ) {
      const delta = String(event.delta ?? '');
      this.assistantPartial += delta;
      this.handlers.onAssistantTranscript(this.assistantPartial, false);
      return;
    }
    if (
      type === 'response.output_audio_transcript.done' ||
      type === 'response.audio_transcript.done'
    ) {
      const text = String(event.transcript ?? this.assistantPartial);
      this.assistantPartial = '';
      if (text) this.handlers.onAssistantTranscript(text, true);
      return;
    }
    if (type === 'output_audio_buffer.started' || type === 'response.output_audio.delta') {
      if (!this.executing) this.handlers.onState('assistant_speaking');
      return;
    }
    if (type === 'output_audio_buffer.stopped') {
      if (!this.executing) this.handlers.onState('ready');
      return;
    }
    if (type === 'response.created') {
      this.assistantPartial = '';
      if (!this.executing) this.handlers.onState('processing');
      return;
    }
    if (type === 'response.done') {
      void this.handleResponseDone(event);
      return;
    }
    if (type === 'error') {
      const error = event.error as { message?: string } | undefined;
      this.handlers.onError(error?.message || 'Realtime voice error.');
    }
  }

  private async handleResponseDone(event: Record<string, unknown>) {
    const response = event.response as
      | { output?: Array<{ type?: string; name?: string; call_id?: string; arguments?: string }> }
      | undefined;
    const calls = (response?.output ?? []).filter(
      (item) => item.type === 'function_call' && item.call_id && item.name
    );
    const fresh = calls.filter((item) => !this.handledCalls.has(item.call_id!));
    if (!fresh.length) {
      if (!this.executing) this.handlers.onState('ready');
      return;
    }
    fresh.forEach((item) => this.handledCalls.add(item.call_id!));
    await this.handlers.onFunctionCalls(
      fresh.map((item) => ({
        callId: item.call_id!,
        name: item.name!,
        arguments: item.arguments || '{}',
      }))
    );
  }
}

function waitForDataChannel(dc: RTCDataChannel) {
  if (dc.readyState === 'open') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Voice data channel timed out.')), 8000);
    dc.addEventListener(
      'open',
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
    dc.addEventListener(
      'error',
      () => {
        window.clearTimeout(timer);
        reject(new Error('Voice data channel failed.'));
      },
      { once: true }
    );
  });
}

function waitForIce(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => resolve(), 1200);
    const onChange = () => {
      if (pc.iceGatheringState !== 'complete') return;
      window.clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}
