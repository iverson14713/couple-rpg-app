export const COMPANIONSHIP_CUSTOM_MAX_LEN = 30;

const UNSUITABLE_HINT = '請輸入溫柔、適合傳給對方的短句';

export type CompanionshipCustomValidation =
  | { ok: true; message: string }
  | { ok: false; hint: string };

/** 單行短句：trim、去換行、最多 30 字 */
export function validateCompanionshipCustomMessage(raw: string): CompanionshipCustomValidation {
  const singleLine = raw.replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ');
  const message = singleLine.trim();

  if (!message) {
    return { ok: false, hint: UNSUITABLE_HINT };
  }

  if (message.length > COMPANIONSHIP_CUSTOM_MAX_LEN) {
    return { ok: false, hint: `最多 ${COMPANIONSHIP_CUSTOM_MAX_LEN} 字` };
  }

  if (!/[\p{L}\p{Script=Han}]/u.test(message)) {
    return { ok: false, hint: UNSUITABLE_HINT };
  }

  return { ok: true, message };
}
