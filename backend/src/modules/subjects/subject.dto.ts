import { Classroom, Department, Subject, User } from "@prisma/client";

type SubjectWithRelations = Subject & {
  teacher: User;
  classroom: Classroom | null;
  department: Department | null;
};

export function toSubjectDto(s: SubjectWithRelations) {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    level: s.level,
    levelYear: s.levelYear,
    term: s.term,
    year: s.year,
    roomCount: s.roomCount,
    studentCount: s.studentCount,
    teacherId: s.teacherId,
    teacherName: s.teacher.fullName,
    classroomId: s.classroomId,
    classroomLabel: s.classroom?.label ?? null,
    departmentId: s.departmentId,
    departmentName: s.department?.name ?? null,
  };
}

export type SubjectDto = ReturnType<typeof toSubjectDto>;
