-- ========================================================
-- SCHOOL MANAGEMENT SYSTEM DATABASE INITIALIZATION
-- ========================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class" TEXT,
    "gender" TEXT,
    "dob" TEXT,
    "dateOfAdmission" TEXT,
    "club" TEXT,
    "guardianName" TEXT,
    "residentialAddress" TEXT,
    "contact" TEXT,
    "status" TEXT DEFAULT 'Active',
    "photo" TEXT
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "email" TEXT UNIQUE,
    "contact" TEXT,
    "status" TEXT DEFAULT 'Active'
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE,
    "departmentId" TEXT
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hodId" TEXT,
    "teacherIds" TEXT[] DEFAULT '{}',
    "subjectIds" TEXT[] DEFAULT '{}'
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gradeTeacherId" TEXT,
    "subjectIds" TEXT[] DEFAULT '{}'
);

-- 6. Subject Allocations Table
CREATE TABLE IF NOT EXISTS public.allocations (
    "id" TEXT PRIMARY KEY,
    "classId" TEXT,
    "teacherId" TEXT,
    "subjectId" TEXT
);

-- 7. Exam Sessions Table
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" TEXT,
    "term" TEXT
);

-- 8. Student Marks Table
CREATE TABLE IF NOT EXISTS public.student_marks (
    "id" TEXT PRIMARY KEY,
    "studentId" TEXT,
    "sessionId" TEXT,
    "subjectId" TEXT,
    "score" INTEGER
);

-- 9. Grade Scales Table
CREATE TABLE IF NOT EXISTS public.grade_scales (
    "id" TEXT PRIMARY KEY,
    "label" TEXT,
    "minMark" INTEGER,
    "maxMark" INTEGER,
    "description" TEXT
);

-- 10. Fee Structures Table
CREATE TABLE IF NOT EXISTS public.fee_structures (
    "id" TEXT PRIMARY KEY,
    "className" TEXT NOT NULL,
    "tuitionFee" INTEGER DEFAULT 0,
    "developmentFee" INTEGER DEFAULT 0,
    "examFee" INTEGER DEFAULT 0,
    "otherFees" INTEGER DEFAULT 0,
    "term" TEXT,
    "year" TEXT
);

-- 11. Fee Payments Table
CREATE TABLE IF NOT EXISTS public.fee_payments (
    "id" TEXT PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TEXT,
    "paymentMethod" TEXT,
    "receiptNumber" TEXT,
    "term" TEXT,
    "year" TEXT,
    "recordedBy" TEXT,
    "note" TEXT
);

-- 12. Online Exams Table
CREATE TABLE IF NOT EXISTS public.online_exams (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "classId" TEXT,
    "teacherId" TEXT,
    "questions" JSONB DEFAULT '[]',
    "status" TEXT DEFAULT 'Draft',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Exam Submissions Table
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    "id" TEXT PRIMARY KEY,
    "examId" TEXT,
    "studentId" TEXT,
    "answers" JSONB DEFAULT '{}',
    "score" INTEGER,
    "totalPoints" INTEGER,
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Learning Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "classId" TEXT,
    "teacherId" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileData" TEXT,
    "uploadDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Official Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "senderId" TEXT,
    "senderName" TEXT,
    "senderRole" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Daily Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    "id" TEXT PRIMARY KEY,
    "date" TEXT,
    "studentId" TEXT,
    "status" TEXT,
    "conduct" TEXT
);

-- 17. Periodmeter Allocations
CREATE TABLE IF NOT EXISTS public.period_allocations (
    "id" TEXT PRIMARY KEY,
    "teacherId" TEXT,
    "classId" TEXT,
    "subjectId" TEXT,
    "weeklyTarget" INTEGER DEFAULT 5
);

-- 18. Periodmeter Sessions
CREATE TABLE IF NOT EXISTS public.period_sessions (
    "id" TEXT PRIMARY KEY,
    "allocationId" TEXT,
    "date" TEXT,
    "periodsHeld" INTEGER DEFAULT 1,
    "recordedBy" TEXT
);

-- 19. Periodmeter Attendance
CREATE TABLE IF NOT EXISTS public.period_attendance (
    "id" TEXT PRIMARY KEY,
    "sessionId" TEXT,
    "studentId" TEXT,
    "status" TEXT DEFAULT 'P'
);

-- 20. System Branding Settings
CREATE TABLE IF NOT EXISTS public.settings (
    "key" TEXT PRIMARY KEY,
    "value" TEXT
);

-- ========================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS
-- ========================================================
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;

-- ========================================================
-- SEED DATA (INITIAL SETUP)
-- ========================================================

-- Initial Grading Scale (Zambian 1-9 system)
-- QUOTED COLUMNS TO PREVENT CASE SENSITIVITY ERRORS
INSERT INTO public.grade_scales ("id", "label", "minMark", "maxMark", "description") VALUES
('G1', '1', 75, 100, 'Distinction'),
('G2', '2', 70, 74, 'Excellent'),
('G3', '3', 65, 69, 'Merit'),
('G4', '4', 60, 64, 'Credit'),
('G5', '5', 55, 59, 'Satisfactory'),
('G6', '6', 50, 54, 'Pass'),
('G7', '7', 45, 49, 'Marginal Pass'),
('G8', '8', 40, 44, 'Satisfactory (GCE)'),
('G9', '9', 0, 39, 'Unsatisfactory / Fail'),
('GX', 'X', -1, -1, 'Absent')
ON CONFLICT ("id") DO NOTHING;

-- Initial Settings
INSERT INTO public.settings ("key", "value") VALUES
('schoolName', 'IvorSmartSchools Academy'),
('schoolMotto', 'Smart Learning for a Smart Future'),
('schoolContact', '+260 977 134049')
ON CONFLICT ("key") DO NOTHING;

-- Dummy Classes
INSERT INTO public.classes ("id", "name") VALUES
('CLS01', 'Grade 10 A'),
('CLS02', 'Grade 11 B'),
('CLS03', 'Grade 12 C')
ON CONFLICT ("id") DO NOTHING;

-- Dummy Subjects
INSERT INTO public.subjects ("id", "name", "code") VALUES
('SUB01', 'Mathematics', 'MATH101'),
('SUB02', 'English Language', 'ENG101'),
('SUB03', 'Physics', 'PHY101'),
('SUB04', 'Biology', 'BIO101')
ON CONFLICT ("id") DO NOTHING;