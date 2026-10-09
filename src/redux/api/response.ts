import { isRecord } from "@/utils/apiError";

export type MessageResponse = { success?: boolean; message?: string };

export function isSuccessfulResponse(response: Response, body: unknown): boolean {
  return response.ok && isRecord(body) && !!body.success;
}

export function hasDataField(body: unknown, field: string): boolean {
  return isRecord(body) && isRecord(body.data) && !!body.data[field];
}

export function responseMessage(body: MessageResponse, fallback: string): string {
  return body.message?.trim() || fallback;
}
