# Demo Plan

## Projekti dhe perdoruesi

Smart Exam Mode eshte platforme studimi per studente qe duan t'i mbajne materialet, pyetjet me AI dhe pergatitjen per provim ne nje vend te vetem. Aplikacioni u sherben sidomos studenteve qe kane shume leksione dhe duan nje rrjedhe me te qarte nga ngarkimi i materialeve deri te provimi praktik.

## Flow kryesor per demo (5-7 min)

### 0:00-0:45 - Hyrja
- Shpjegoj shkurt problemin: materialet, pyetjet dhe pergatitja zakonisht jane te shperndara.
- Tregoj vleren e projektit: nje panel i vetem per materiale, AI chat, gjenerim provimi dhe live exam mode.

### 0:45-2:00 - Lectures
- Hyr ne `Dashboard -> Lectures`.
- Tregoj upload-in e nje materiali PDF, DOCX ose TXT.
- Tregoj listen e materialeve, metadata, preview dhe faktin qe materialet ruhen ne Supabase Storage.

### 2:00-3:15 - AI Chat
- Kthehem te dashboard.
- Bej nje pyetje reale mbi materialin e ngarkuar.
- Tregoj qe pergjigjja bazohet ne lecture context dhe jo vetem ne nje pergjigje te pergjithshme.

### 3:15-4:45 - Exam Builder
- Hap `Dashboard -> Exams`.
- Tregoj zgjedhjen e leksioneve burim, veshtiresine, kohezgjatjen dhe numrin e pyetjeve.
- Gjeneroj nje draft provimi me AI.
- Tregoj qe drafti mund te modifikohet para publikimit.

### 4:45-6:00 - Publish dhe Live Exam Mode
- Publikoj provimin.
- Hap provimin live.
- Tregoj timer-in, navigimin mes pyetjeve dhe violation tracking.
- Permend qe humbja e fokusit dhe Escape numerohen si shkelje dhe pas 3 shkeljeve provimi dergohet automatikisht.

### 6:00-7:00 - Mbyllja
- Permbledh vleren: materiale + AI + exam workflow + anti-switch exam mode.
- Them shkurt cfare eshte ndertuar teknikisht dhe pse zgjodha kete flow si demonstrimin me te forte.

## Pjeset teknike qe do t'i shpjegoj shkurt

- `Next.js App Router` per frontend dhe API routes.
- `Supabase Auth` per identitetin e perdoruesit dhe izolimin sipas `user_id`.
- `Supabase Database + RLS` per `lecture_files`, `exams`, `exam_attempts` dhe `tasks`.
- `Supabase Storage` per ruajtjen e materialeve.
- `OpenRouter + OpenAI SDK` per AI chat dhe gjenerim provimi.
- Parsing i skedareve `PDF`, `DOCX` dhe `TXT` para perdorimit si context.

## Cfare kam kontrolluar para demos

- `npm run build` kalon me sukses ne production build.
- Login, signup dhe reset password kane flow te qarte.
- Upload dhe preview i materialeve funksionojne.
- AI chat kthen pergjigje kur `OPENROUTER_API_KEY` eshte konfiguruar.
- Gjenerimi i provimit punon me materiale ose me `topic focus`.
- Publikimi i provimit dhe live exam mode varen nga tabelat e krijuara me `supabase_setup.sql`.
- README eshte perditesuar me setup dhe demo flow.

## Plani B nese live demo deshton

- Nese URL live nuk hapet, demonstroj lokalisht me `npm run dev`.
- Nese OpenRouter ka vonese ose rate limit, tregoj draft provimi te gjeneruar me pare dhe shpjegoj flow-n.
- Nese Supabase ka problem me rrjetin, tregoj strukturat e databazes ne `supabase_setup.sql` dhe screenshot/video te rrjedhes.
- Mbaj nje material testues dhe nje llogari testuese gati para prezantimit.

## Live URL

- Repository: `https://github.com/fnebihi10/Smart-exam-mode`
- Live URL: shtoje ketu pasi te deploy-ohet dhe verifikohet

## Readiness note

Per prezantimin final do te perdor flow-n `Lectures -> AI Chat -> Exam Builder -> Publish -> Live Exam`. Ky eshte flow-ja me e mire sepse tregon vleren e plote te produktit pa humbur ne detaje sekondare.
