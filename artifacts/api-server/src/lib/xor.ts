export function xorEncryptDecrypt(data: Buffer, key: string): Buffer {
  const result = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key.charCodeAt(i % key.length);
  }
  return result;
}

export function xorEncryptString(text: string, key: string): Buffer {
  const buf = Buffer.from(text, "binary");
  return xorEncryptDecrypt(buf, key);
}

export function xorDecryptToString(data: Buffer, key: string): string {
  return xorEncryptDecrypt(data, key).toString("binary");
}

export const DEFAULT_XOR_KEY =
  process.env["XOR_KEY"] ??
  "PQRSTU3456789&*CDEFGHIJKLMNOPQRSTUVdefgh',<GHIJKLMNOPQRSTUVWjklmnopqrstuvwxy3456,<>?/`~JKLMNOPQRSTUVFGHIJKLMNOlmn2345^&*()-CDEFGHIJKLMNOPQRSTUVWXefghijklmnopqrst7KLMNOPQRSTU45678[]{}|;:',<>tu2)-_=+[]ij23456IJKLMNQRSTUVWbcdefghijklmnopqrstGHIJKLMNhijklmnopqrstuvwxy01234STUVWXYdefghijklmnopqrstuvw=+[]{}|;:',<>?/CDEFGHI|;:',<>?";
