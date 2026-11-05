// Pipeline 1 repo (script khusus repo ini; REPOS berisi satu path):
// inventaris -> audit mendalam + konfirmasi independen -> perbaikan (dinamisasi + restyle admin) -> gate typecheck + verifikasi.

interface BlockInfo {
  /** Id tipe blok sesuai registry/contracts. */
  id: string;
  /** Path file kontrak/skema. */
  contract: string;
  /** Path komponen renderer. */
  renderer: string;
  /** Asal konten blok: "db/admin" | "props halaman" | "hardcoded" | "campuran". */
  contentSource: string;
}

interface RouteInfo {
  /** Pola rute publik, mis. "/" atau "/insights/[slug]". */
  route: string;
  /** Path file page.tsx. */
  file: string;
  /** Sumber data aktual yang dibaca page. */
  dataSource: string;
  /** true hanya bila konten benar-benar dinamis dari DB/admin. */
  dynamic: boolean;
}

interface AdminInfo {
  /** Ada UI admin di repo ini? */
  exists: boolean;
  /** Path layout/halaman/komponen admin utama. */
  paths: string[];
  /** Path file styling yang memengaruhi tampilan admin (globals.css, tailwind config, layout). */
  styleFiles: string[];
  /** 1-2 kalimat: gaya admin saat ini vs gaya frontend. */
  styleGap: string;
}

interface RepoInventory {
  /** Path absolut repo. */
  repo: string;
  /** Ringkasan 2-3 kalimat sistem blok & aliran konten. */
  blockSystem: string;
  blocks: BlockInfo[];
  admin: AdminInfo;
  /** Rute publik "/" dan semua rute dinamis [slug]. */
  routes: RouteInfo[];
  /** Konvensi wajib repo (dari AGENTS.md/CLAUDE.md), ringkas. */
  conventions: string;
  /** Nama script typecheck di package.json. */
  typecheckScript: string;
}

interface RawFinding {
  /** path:line */
  where: string;
  /** Kategori temuan. */
  category: "blok-konten" | "hardcode" | "rute-statis" | "gap-admin" | "gaya-admin";
  /** Satu kalimat masalahnya. */
  what: string;
  /** Bukti: kutipan baris yang dibaca. */
  evidence: string;
  /** "high" untuk konten tampil salah / halaman mati. */
  severity: "low" | "medium" | "high";
}

interface AuditResult {
  /** Temuan prioritas, maksimal 15, urut dari paling berat. */
  findings: RawFinding[];
  /** Jumlah temuan di luar 15 (0 bila tidak ada). */
  overflowCount: number;
}

interface Finding {
  /** Id stabil, mis. "ERFO-F3". */
  id: string;
  repo: string;
  where: string;
  category: "blok-konten" | "hardcode" | "rute-statis" | "gap-admin" | "gaya-admin" | "lain-lain";
  what: string;
  evidence: string;
  severity: "low" | "medium" | "high";
  /** "verified" = dikonfirmasi konfirmator independen. */
  status: "verified" | "unconfirmed";
}

interface ConfirmResult {
  /** true hanya bila kamu sendiri melihat masalahnya di kode. */
  confirmed: boolean;
  /** Bukti yang kamu lihat saat memeriksa. */
  alasan: string;
}

interface FixOutcome {
  /** Path file yang diubah. */
  fixedFiles: string[];
  /** Ringkasan apa yang dikerjakan. */
  ringkasan: string;
}

interface VerifyItem {
  /** Id temuan. */
  id: string;
  /** Sudahkah perbaikan menyelesaikan temuan? */
  fixed: boolean;
  /** Bukti pemeriksaan (path:line). */
  catatan: string;
}

interface VerifyCheck {
  results: VerifyItem[];
  /** Masalah lain yang masih tersisa di repo ini. */
  sisa: string[];
}

interface RepoFindings {
  inventory: RepoInventory;
  findings: Finding[];
  /** Catatan bila audit gagal/sebagian. */
  auditNote: string;
}

interface RepoForVerify {
  inventory: RepoInventory;
  findings: Finding[];
  fixNotes: string[];
  fixedFiles: string[];
}

interface VerifyOutcome {
  repo: string;
  gatePassed: boolean;
  gateNote: string;
  /** Setiap temuan dengan hasil akhirnya; fixed=null berarti tidak diproses. */
  items: { finding: Finding; fixed: boolean | null; catatan: string }[];
  sisa: string[];
}

interface ReportFinding {
  id: string;
  repo: string;
  /** path:line. */
  where: string;
  what: string;
  evidence: string;
  severity: "low" | "medium" | "high";
  status: "verified" | "unconfirmed";
  /** Hasil perbaikan. */
  perbaikan: string;
}

interface WorkflowReport {
  /** 2-3 kalimat yang menjawab permintaan user. */
  conclusion: string;
  findings: ReportFinding[];
  /** Apa yang diperiksa run ini dan bagaimana. */
  verified: string[];
  /** Apa yang tidak tercakup dan kenapa. */
  notCovered: string[];
}

const REPOS = [
  "/Users/macprom12020/Code/unimasi",
];

function shortName(repo: string): string {
  return repo.split("/").pop() ?? repo;
}

function tag(repo: string): string {
  const n = shortName(repo);
  if (n === "erfo") return "ERFO";
  if (n === "unimasi") return "UNIMASI";
  return "SEGIWEB";
}

function gateArgs(repo: string): string[] {
  if (repo.endsWith("/erfo")) return ["run", "typecheck"];
  if (repo.endsWith("/unimasi")) return ["--prefix", repo, "run", "typecheck"];
  return ["--prefix", repo, "run", "type-check"];
}

function card(f: Finding, status: string) {
  return { id: f.id, repo: f.repo, what: f.what, category: f.category, severity: f.severity, status };
}

const BRIEF =
  "Konteks: repo ini adalah derivatif engine WebShift Core: Next.js 16 App Router + React 19 + Prisma 8 (@prisma/orm-postgres) + NextAuth v5 + Tailwind 3 + GSAP/Three.js, src/proxy.ts (BUKAN middleware.ts), blok SDUI di src/blocks (contracts.ts + registry.ts + BlockRenderer.tsx + komponen blok), studio admin di /admin (src/app/admin), Delivery API /api/v1/delivery/*, konten seed di scripts/seed.ts & src/data.";

const HONESTY =
  "Aturan kerja: kutip bukti path:line untuk setiap klaim; jangan pernah melaporkan pemeriksaan yang tidak kamu lakukan; " +
  "jika instruksi bertentangan atau tugas mustahil, eskalasikan pertanyaan yang jelas daripada mengarang jalan keluar.";

artifact.board("temuan", {
  title: "Papan temuan & perbaikan",
  description: "Siklus tiap temuan: dikonfirmasi -> diperbaiki -> terverifikasi.",
  key: "id",
  status: "status",
  columns: ["Dikonfirmasi", "Sedang diperbaiki", "Terperbaiki", "Tidak terperbaiki", "Belum dikonfirmasi"],
  cardTitle: "what",
  detail: [
    { field: "repo", label: "Repo" },
    { field: "severity", label: "Prioritas" },
    { field: "category", label: "Kategori" },
  ],
});

const invCh = channel<RepoInventory>("inventaris");
const fixCh = channel<RepoFindings>("temuan-repo");
const verCh = channel<RepoForVerify>("perbaikan-repo");

log(`Memetakan arsitektur konten di ${REPOS.length} repo secara paralel`);

const inventoryStage = future(async () => {
  phase("Inventarisasi blok & admin");
  try {
    await Promise.all(
      REPOS.map((repo) =>
        agent(`Kartografer ${shortName(repo)}`, {
          system: `Kamu kartografer arsitektur frontend/admin yang teliti. Bekerja read-only di ${repo} — jangan mengubah file apa pun. ${HONESTY}`,
        })
          .ask<RepoInventory>(
            `${BRIEF}\n\nTugasmu: petakan repo ${repo} (read-only) dan isi RepoInventory:\n` +
              `1. Baca AGENTS.md / CLAUDE.md di root repo bila ada; ringkas konvensi wajib untuk siapa pun yang mengubah kode (1-2 kalimat).\n` +
              `2. Petakan SEMUA tipe blok: baca src/blocks/contracts.ts, registry.ts, dan ontology bila ada . Untuk setiap blok: id, path kontrak, path renderer, dan asal kontennya (buka renderer sekilas: apakah teks/gambar dari props/data atau hardcoded).\n` +
              `3. Petakan UI admin: path layout, halaman, komponen editor konten (src/app/admin/**), plus file styling yang memengaruhi tampilan admin (globals.css, tailwind.config, layout). Bandingkan sekilas dengan style frontend (tokens/globals: font & warna) — tulis 1-2 kalimat styleGap.\n` +
              `4. Petakan rute frontend publik: "/" dan SEMUA rute dinamis [slug] (insights, portfolio, services, p, dsb.). Untuk setiap rute buka page.tsx-nya: sumber data aktual (fetch Prisma? import statis dari src/data? hardcode JSX?) dan dynamic=true hanya bila benar-benar dari DB/admin.\n` +
              `5. Nama script typecheck di package.json (mis. "typecheck" atau "type-check").\n` +
              `Jangan menilai atau memperbaiki apa pun — cukup peta yang akurat. Path yang kamu laporkan harus bisa dibuka langsung.`,
          )
          .then((inv) => invCh.send(inv)),
      ),
    );
  } finally {
    invCh.close();
  }
});

const auditStage = future(async () => {
  phase("Audit mendalam & konfirmasi independen");
  try {
    await Promise.all(
      [1, 2].map(async () => {
        for await (const inv of invCh) {
          const repo = inv.repo;
          const name = shortName(repo);
          log(`Mengaudit ${name}...`);
          let auditNote = "";
          let raw: AuditResult = { findings: [], overflowCount: 0 };
          try {
            raw = await agent(`Auditor ${name}`, {
              system: `Kamu auditor konten & arsitektur yang sangat teliti. Bekerja read-only di ${repo} — jangan mengubah file apa pun. ${HONESTY}`,
            }).ask<AuditResult>(
              `${BRIEF}\n\nAudit mendalam repo ${repo}. Inventaris peta:\n${JSON.stringify(inv)}\n\n` +
                `Cari temuan (maksimal 15, urut dari paling berat) lewat empat lensa:\n` +
                `A. Kesesuaian blok — untuk SETIAP tipe blok di inventaris: buka renderer & kontraknya. Pastikan teks dan gambar yang benar-benar TAMPIL di frontend datang dari data blok (props dari halaman/DB yang diedit admin), bukan teks/gambar hardcode, placeholder, atau default yang tidak terkontrol admin. Gambar wajib punya alt dan sumber dari data/media. Catat juga field kontrak yang tidak pernah dirender, dan teks statis di renderer.\n` +
                `B. Dinamisasi rute — untuk "/" dan setiap rute [slug]: pastikan kontennya diambil dari DB (Prisma) / sumber yang diedit admin. Flag setiap halaman yang masih merender dari import statis src/data atau hardcode JSX. Konten dari DB via seed = dinamis (aman); hardcode di page/blok = pelanggaran.\n` +
                `C. Kontrol admin — untuk konten yang menggerakkan tiap rute: adakah editor di admin yang mengelolanya? Flag konten penting yang tidak bisa diedit dari admin.\n` +
                `D. Gaya UI admin — bandingkan style admin (layout, komponen, globals) dengan style frontend (font, warna, token). Daftar gap konkret yang perlu di-restyle (tanpa mengubah fungsi).\n\n` +
                `Setiap temuan wajib punya where (path:line), what (satu kalimat), evidence (kutipan baris yang kamu baca), category, severity. Jangan mengubah file. Jika ada rute publik lain di luar inventaris, audit juga.`,
            );
          } catch (err) {
            auditNote = `Audit ${name} gagal: ${String(err)}`;
            log(auditNote);
          }
          const top = raw.findings.slice(0, 15);
          const confirmed = await Promise.all(
            top.map(async (f, i) => {
              const c = await agent(`Konfirmator ${name} ${i + 1}`, {
                system: `Kamu konfirmator independen yang skeptis. Bekerja read-only di ${repo} — jangan mengubah file. ${HONESTY}`,
              }).ask<ConfirmResult>(
                `Reproduksi atau bantah temuan audit ini di repo ${repo}, HANYA dari bukti di kode (baca file di "where" dan konteks sekitarnya; boleh membaca file lain untuk konteks):\n${JSON.stringify(f)}\n\nconfirmed=true hanya jika kamu sendiri melihat masalahnya benar-benar ada di kode. Jika temuannya benar tetapi detail path/baris meleset, tetap confirmed=true dan tulis koreksinya di alasan.`,
              );
              const finding: Finding = {
                id: `${tag(repo)}-F${i + 1}`,
                repo,
                where: f.where,
                category: f.category,
                what: f.what,
                evidence: `${f.evidence} | Konfirmator: ${c.alasan}`.slice(0, 900),
                severity: f.severity,
                status: c.confirmed ? "verified" : "unconfirmed",
              };
              report(card(finding, c.confirmed ? "Dikonfirmasi" : "Belum dikonfirmasi"), "temuan");
              return finding;
            }),
          );
          if (raw.overflowCount > 0) {
            const over: Finding = {
              id: `${tag(repo)}-OVERFLOW`,
              repo,
              where: repo,
              category: "lain-lain",
              what: `${raw.overflowCount} temuan tambahan di luar batas 15 per repo tidak diaudit mendalam.`,
              evidence: "Disebut auditor tetapi tidak dikonfirmasi satu per satu.",
              severity: "low",
              status: "unconfirmed",
            };
            confirmed.push(over);
            report(card(over, "Belum dikonfirmasi"), "temuan");
          }
          await fixCh.send({ inventory: inv, findings: confirmed, auditNote });
        }
      }),
    );
  } finally {
    fixCh.close();
  }
});

const fixStage = future(async () => {
  phase("Perbaikan dinamisasi & gaya UI admin");
  try {
    await Promise.all(
      [1, 2].map(async () => {
        for await (const rf of fixCh) {
          const repo = rf.inventory.repo;
          const name = shortName(repo);
          const verified = rf.findings.filter((f) => f.status === "verified");
          const fixNotes: string[] = [];
          const fixedFiles: string[] = [];
          if (rf.auditNote) fixNotes.push(rf.auditNote);

          const dynamismFindings = verified.filter((f) => f.category !== "gaya-admin");
          if (dynamismFindings.length > 0) {
            for (const f of dynamismFindings) report(card(f, "Sedang diperbaiki"), "temuan");
            const out = await agent(`Pembenah konten ${name}`, {
              system: `Kamu engineer Next.js yang hati-hati. Ubah hanya repo ${repo}. ${HONESTY}`,
            }).ask<FixOutcome>(
              `${BRIEF}\n\nPerbaiki temuan audit terverifikasi berikut di ${repo}:\n${JSON.stringify(dynamismFindings)}\n\n` +
                `Inventaris peta repo:\n${JSON.stringify(rf.inventory)}\n\n` +
                `Aturan perbaikan:\n` +
                `1. Baca AGENTS.md / CLAUDE.md di root repo dulu dan ikuti aturannya (untuk erfo: jangan buat middleware.ts, semua di src/proxy.ts; Prisma 8 via src/lib/db; blok wajib lolos kontrak Zod).\n` +
                `2. Pastikan rute "/" dan semua rute [slug] merender konten dari DB (Prisma) / sumber yang diedit admin — hapus import statis/hardcode JSX yang menggerakkan konten. Konten seed di DB adalah sumber dinamis yang sah; fallback saat DB kosong boleh asal konten utama dari DB.\n` +
                `3. Pastikan setiap blok merender teks & gambar dari props/data blok; hapus teks/gambar hardcode yang tampil; semua gambar punya alt dari data.\n` +
                `4. Jaga kontrak blok (contracts.ts), validasi Zod, dan skema Prisma yang ada — jangan mengubah schema.prisma, jangan db:push, jangan menambah dependency, jangan menjalankan dev server atau build.\n` +
                `5. Jangan mengubah gaya visual frontend dan jangan menyentuh src/app/admin (itu tugas pembenah lain yang jalan setelah kamu).\n` +
                `6. Jangan jalankan typecheck/build — gate terpisah akan memeriksanya.\n\n` +
                `Laporkan fixedFiles (path file yang diubah) dan ringkasan. Jika ada temuan yang tidak bisa/layak diperbaiki, sebutkan alasannya di ringkasan.`,
            );
            fixNotes.push(`Pembenah konten: ${out.ringkasan}`);
            fixedFiles.push(...out.fixedFiles);
          } else {
            fixNotes.push("Tidak ada temuan dinamisasi terverifikasi yang perlu diperbaiki.");
          }

          if (rf.inventory.admin.exists) {
            const adminFindings = verified.filter((f) => f.category === "gaya-admin");
            const out = await agent(`Pembenah UI admin ${name}`, {
              system: `Kamu engineer UI yang rapi. Ubah hanya repo ${repo}, hanya area admin. ${HONESTY}`,
            }).ask<FixOutcome>(
              `${BRIEF}\n\nRestyle UI admin di ${repo} supaya konsisten dengan style frontend-nya sendiri (goal eksplisit user, jalankan meski tidak ada temuan gaya).\n` +
                `Gaya admin saat ini vs frontend: ${rf.inventory.admin.styleGap || "lihat langsung di kode"}\n` +
                `File styling terkait: ${JSON.stringify(rf.inventory.admin.styleFiles)}\n` +
                (adminFindings.length > 0 ? `Temuan gaya dari audit:\n${JSON.stringify(adminFindings)}\n` : "") +
                `Aturan:\n` +
                `1. Tarik gaya dari frontend repo ini sendiri: token warna (design-tokens.json / tokens.css / globals.css), font heading & body, radius, spacing, bayangan, dan pola komponen (tombol, kartu, input, tabel, badge, sidebar/nav). Terapkan konsisten di seluruh halaman admin: layout, dashboard, editor/manajer konten, preview, login.\n` +
                `2. Pertahankan semua fungsi, struktur komponen, dan props — ini restyle, bukan rombak total; jangan menambah dependency.\n` +
                `3. Jangan menyentuh halaman publik maupun logika data.\n` +
                `4. Baca AGENTS.md / CLAUDE.md root repo bila ada dan ikuti.\n` +
                `5. Setelah selesai mengubah kode, jalankan pengecekan tipe repo (script typecheck/type-check di package.json) dan pastikan lulus; perbaiki error yang kamu sebabkan.\n\n` +
                `Laporkan fixedFiles dan ringkasan.`,
            );
            fixNotes.push(`Pembenah UI admin: ${out.ringkasan}`);
            fixedFiles.push(...out.fixedFiles);
          } else {
            fixNotes.push("Repo ini tidak memiliki UI admin sendiri; restyle dilewati.");
          }
          await verCh.send({ inventory: rf.inventory, findings: rf.findings, fixNotes, fixedFiles });
        }
      }),
    );
  } finally {
    verCh.close();
  }
});

const verifyStage = future(async () => {
  phase("Verifikasi typecheck & pemeriksaan akhir per repo");
  const outcomes: VerifyOutcome[] = [];
  await Promise.all(
    [1, 2].map(async () => {
      for await (const item of verCh) {
        const repo = item.inventory.repo;
        const name = shortName(repo);
        log(`Memverifikasi ${name}...`);
        let gate = await world.run("npm", gateArgs(repo), { timeoutMs: 900_000, output: { tail: 16_384 } });
        let round = 0;
        while (gate.exitCode !== 0 && round < 3) {
          round += 1;
          log(`Typecheck ${name} gagal (ronde ${round}) — memanggil pembenah gate`);
          await agent(`Pembenah gate ${name} ${round}`, {
            system: `Kamu engineer yang memperbaiki error kompilasi di ${repo} saja. ${HONESTY}`,
          }).ask<string>(
            `Typecheck di ${repo} gagal setelah perbaikan konten & restyle admin. Tail output:\n${gate.stderr || gate.stdout}\n\nBaca error-nya, buka file yang disebut, dan perbaiki penyebab sebenarnya di kode (jangan menyesuaikan gate, jangan matikan pengecekan). Error bisa berasal dari perbaikan konten maupun restyle admin. Jawab singkat: apa yang kamu perbaiki.`,
          );
          gate = await world.run("npm", gateArgs(repo), { timeoutMs: 900_000, output: { tail: 16_384 } });
        }
        const gatePassed = gate.exitCode === 0;
        const gateNote = gatePassed ? `npm ${gateArgs(repo).join(" ")} lulus` : `typecheck masih gagal setelah ${round} ronde perbaikan`;
        const check = await agent(`Verifikator ${name}`, {
          system: `Kamu verifikator independen. Read-only di ${repo} — jangan mengubah file. ${HONESTY}`,
        }).ask<VerifyCheck>(
          `${BRIEF}\n\nPeriksa hasil perbaikan di ${repo} (read-only).\n` +
            `Catatan perbaikan:\n${JSON.stringify(item.fixNotes)}\n\n` +
            `Untuk SETIAP temuan berikut, periksa kode saat ini: sudahkah teratasi?\n${JSON.stringify(item.findings.filter((f) => f.status === "verified"))}\n\n` +
            `Selain itu, periksa syarat umum di repo ini dan tulis yang belum terpenuhi di "sisa":\n` +
            `1. Rute "/" dan semua rute [slug] publik merender konten dinamis dari DB/admin.\n` +
            `2. Setiap blok merender teks & gambar dari data (tidak ada hardcode yang tampil).\n` +
            `3. UI admin kini memakai gaya frontend (token warna & font yang sama).\n\n` +
            `Setiap results[] wajib: id temuan, fixed (bool), catatan bukti (path:line).`,
        );
        for (const f of item.findings) {
          if (f.status !== "verified") continue;
          const r = check.results.find((x) => x.id === f.id);
          report(card(f, r && r.fixed ? "Terperbaiki" : "Tidak terperbaiki"), "temuan");
        }
        outcomes.push({
          repo,
          gatePassed,
          gateNote,
          items: item.findings.map((f) => {
            if (f.status !== "verified") return { finding: f, fixed: null, catatan: "Tidak diproses: belum terkonfirmasi." };
            const r = check.results.find((x) => x.id === f.id);
            return { finding: f, fixed: r ? r.fixed : false, catatan: r ? r.catatan : "Verifikator tidak melaporkan temuan ini." };
          }),
          sisa: check.sisa,
        });
      }
    }),
  );

  // Gabungan (join): laporan butuh seluruh outcome repo sebelum dirakit.
  const totalFindings = outcomes.reduce((acc, o) => acc + o.items.length, 0);
  const verifiedCount = outcomes.reduce((acc, o) => acc + o.items.filter((it) => it.finding.status === "verified").length, 0);
  const fixedCount = outcomes.reduce((acc, o) => acc + o.items.filter((it) => it.fixed === true).length, 0);
  const gatesPassed = outcomes.filter((o) => o.gatePassed).length;
  const mdLines: string[] = [];
  mdLines.push("# Audit blok, dinamisasi rute & restyle admin", "");
  mdLines.push(`Ringkasan: ${totalFindings} temuan tercatat (${verifiedCount} terverifikasi, ${fixedCount} terperbaiki). Gate typecheck lulus di ${gatesPassed}/1 repo.`, "");
  for (const o of outcomes) {
    mdLines.push(`## ${shortName(o.repo)} (${o.repo})`, "");
    mdLines.push(`- Gate: ${o.gateNote}`);
    for (const note of o.items.length >= 0 ? [] : []) mdLines.push(note);
    for (const f of o.items.map((it) => it.finding)) {
      if (f.status === "unconfirmed") mdLines.push(`- [${f.id}] (belum dikonfirmasi) ${f.what}`);
    }
    mdLines.push("");
    mdLines.push("| ID | Temuan | Lokasi | Prioritas | Status | Perbaikan |", "|---|---|---|---|---|---|");
    for (const it of o.items) {
      const st = it.fixed === true ? "terperbaiki" : it.fixed === false ? "tidak terperbaiki" : "tidak diproses";
      mdLines.push(`| ${it.finding.id} | ${it.finding.what} | ${it.finding.where} | ${it.finding.severity} | ${it.finding.status} | ${st} |`);
    }
    mdLines.push("");
    if (o.sisa.length > 0) {
      mdLines.push("**Masih tersisa:**");
      for (const s of o.sisa) mdLines.push(`- ${s}`);
      mdLines.push("");
    }
  }
  try {
    await artifact.markdown("laporan", mdLines.join("\n"), {
      title: "Laporan audit & perbaikan",
      description: `Temuan blok/dinamisasi/admin + hasil perbaikan & gate typecheck per repo.`,
      primary: true,
    });
  } catch (err) {
    log(`Gagal menerbitkan laporan markdown: ${String(err)}`);
  }
  return outcomes;
});

await Promise.all([inventoryStage, auditStage, fixStage, verifyStage]);
const outcomes = await verifyStage;

const allItems = outcomes.flatMap((o) => o.items.map((it) => ({ repo: o.repo, it })));
const totalFindings = allItems.length;
const verifiedCount = allItems.filter((x) => x.it.finding.status === "verified").length;
const fixedCount = allItems.filter((x) => x.it.fixed === true).length;
const gatesPassed = outcomes.filter((o) => o.gatePassed).length;

const reportFindings: ReportFinding[] = allItems.map((x) => ({
  id: x.it.finding.id,
  repo: x.repo,
  where: x.it.finding.where,
  what: x.it.finding.what,
  evidence: x.it.finding.evidence.slice(0, 500),
  severity: x.it.finding.severity,
  status: x.it.finding.status,
  perbaikan: x.it.fixed === true ? "terperbaiki" : x.it.fixed === false ? "tidak terperbaiki" : "tidak diproses (belum terkonfirmasi)",
}));

const result: WorkflowReport = {
  conclusion: `Audit + perbaikan repo ini selesai: ${totalFindings} temuan tercatat (${verifiedCount} terverifikasi, ${fixedCount} terperbaiki). Gate typecheck lulus di ${gatesPassed}/1 repo. Perbaikan mencakup konten blok dari data, rute \"/\" & [slug] dinamis dari DB/admin, dan restyle UI admin mengikuti gaya frontend.`,
  findings: reportFindings,
  verified: [
    "Inventarisasi repo oleh subagent (blok, admin, rute)",
    "Setiap temuan dikonfirmasi ulang oleh konfirmator independen read-only",
    "Verifikator independen memeriksa hasil perbaikan per temuan per repo",
    `Gate typecheck: npm run typecheck (erfo); npm --prefix <repo> run typecheck (unimasi); npm --prefix <repo> run type-check (segiatech-web) — baseline semua hijau sebelum run`,
  ],
  notCovered: [
    "Uji visual peramban terhadap tampilan admin & frontend (butuh dev server & mata manusia)",
    "Uji runtime dengan database aktif (query Prisma nyata tidak dijalankan)",
    "Temuan di luar batas 15 per repo (tampil sebagai <TAG>-OVERFLOW, tidak diaudit mendalam)",
    "Build produksi (next build) tidak dijalankan; hanya typecheck",
  ],
};
return result;
