import { User } from "@prisma/client";

export function toUserDto(user: User) {
  return {
    id: user.id,
    rmsCode: user.rmsCode,
    username: user.username,
    fullName: user.fullName,
    department: user.department,
    position: user.position,
    role: user.role,
    active: user.active,
  };
}

export type UserDto = ReturnType<typeof toUserDto>;
