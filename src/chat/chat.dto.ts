export class CreateChatDto {
  memberIds: number[];
}

export class CreateChatResponseDto {
  id: number;
  createdAt: Date;
  memberIds: number[];
}
