import { verifyPhoneAssistant } from '../app/lib/ai/verify-pitch';

const result = verifyPhoneAssistant();
if (!result.ok) {
  console.error(result.failures.join('\n'));
  console.log('\n--- log ---\n' + result.log.join('\n'));
  process.exit(1);
}
console.log(result.log.join('\n'));
console.log('\nAll intelligence checks passed.');
