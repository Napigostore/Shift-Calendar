// Giới hạn bản miễn phí và danh sách quyền lợi PRO.
export const FREE_LIMITS = {
  shiftTypes: 8,
  employees: 2,
  events: 2,
  stickerGroups: 2, // 2 nhóm sticker đầu miễn phí
};

export type ProReason =
  | 'shifts'
  | 'staff'
  | 'events'
  | 'yearly'
  | 'export'
  | 'cloud'
  | 'theme'
  | 'stickers'
  | 'tides'
  | 'goal'
  | 'autoLong'
  | 'general';
