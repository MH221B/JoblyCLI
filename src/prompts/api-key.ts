import { password } from '@inquirer/prompts';

const API_KEY_REGEX = /^jobly_sk_[A-Za-z0-9]{20,}$/;

export function validateApiKey(input: string): true | string {
  const trimmed = input.trim();
  if (!trimmed) return 'API key cannot be empty';
  if (trimmed === 'xxx' || trimmed === 'your-key-here') return 'That looks like a placeholder, not a real key';
  if (!API_KEY_REGEX.test(trimmed)) {
    return 'Key must start with "jobly_sk_" followed by at least 20 alphanumeric characters';
  }
  return true;
}

export async function promptApiKey(): Promise<string> {
  const answer = await password({
    message: 'Enter your JoblyAI API key:',
    mask: '*',
    validate: validateApiKey,
  });
  return answer.trim();
}
