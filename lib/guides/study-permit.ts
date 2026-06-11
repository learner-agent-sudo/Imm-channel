import type { Locale } from "@/lib/i18n";
import type { GuideContent } from "@/lib/guides/types";
import { fees, sources, studyCostOfLiving, thirdPartyCosts } from "@/lib/rules/parameters";

const funds = studyCostOfLiving.toLocaleString();
const tuitionMin = thirdPartyCosts.collegeTuitionPerYear[0].toLocaleString();
const tuitionMax = thirdPartyCosts.universityTuitionPerYear[1].toLocaleString();

const pgwpUrl = sources.pgwp.url;
const permitUrl = sources.studyPermit.url;
const fundsUrl = sources.studyFunds.url;
const timesUrl = sources.processingTimes.url;

const en: GuideContent = {
  kicker: "Guide",
  title: "The study permit, step by step",
  intro:
    "For most people who don't qualify for Express Entry today, studying in Canada is the on-ramp: study permit → PGWP → Canadian work experience → PR (and for Hong Kong passport holders, straight to Stream A after graduation). This guide covers the permit itself — the part where most plans fail.",
  facts: [
    { label: "Typical timeline", value: "6–12 months before classes start" },
    { label: "Funds to show", value: `$${funds} + first-year tuition` },
    { label: "Tuition reality", value: `$${tuitionMin}–$${tuitionMax}/yr international` },
  ],
  stepsTitle: "The seven steps",
  steps: [
    {
      title: "Choose the program for the exit, not the entrance",
      body: "If your goal is PR, the program must lead to a post-graduation work permit (PGWP). University degrees (bachelor's, master's, PhD) are PGWP-safe. College diplomas must be in a field of study linked to long-term shortage occupations — check the current eligible-fields list BEFORE paying any deposit. Master's programs of 8+ months earn a full 3-year PGWP; college programs need 2 years for the 3-year permit. Also mind language: PGWP requires CLB 7 (university) or CLB 5 (college).",
      linkUrl: pgwpUrl,
    },
    {
      title: "Get the letter of acceptance (LOA)",
      body: "Apply to 2–3 designated learning institutions (DLIs). Application fees run $100–$250 each. Aim to hold an LOA at least 4–6 months before your intended intake (September intakes: apply by January–March; January intakes: by August–September).",
      linkUrl: permitUrl,
    },
    {
      title: "Provincial Attestation Letter (PAL)",
      body: "Since 2024 most applicants need a PAL proving you fit within the province's study-permit allocation. Your school requests it after you accept the offer and (usually) pay a deposit. Master's/PhD students and some categories are exempt. Budget 2–6 weeks.",
      linkUrl: permitUrl,
    },
    {
      title: "Assemble proof of funds",
      body: `You must show first-year tuition (have receipts for anything prepaid) plus $${funds} cost of living (single applicant outside Quebec) plus travel costs. Practical evidence: a Canadian GIC of $${funds}, 4–6 months of bank statements, sponsor letters with the sponsor's own proof. Funds must look stable — not parked yesterday.`,
      linkUrl: fundsUrl,
    },
    {
      title: "Apply online and complete biometrics",
      body: `The permit fee is $${fees.studyPermit} plus $${fees.biometricsPerPerson} biometrics. After submitting you'll get a biometrics instruction letter — book promptly, the 30-day window is real. Medical exams are required for some countries or if you'll work in healthcare/childcare.`,
      linkUrl: permitUrl,
    },
    {
      title: "Wait out processing — and plan the contingency",
      body: "Processing varies hugely by country (a few weeks to several months) — check the live processing-times tool for your country. If your start date slips, schools can usually defer you one intake. Don't book non-refundable travel until approval.",
      linkUrl: timesUrl,
    },
    {
      title: "After arrival: protect your PR runway",
      body: "Stay full-time enrolled — dropping to part-time can void your PGWP eligibility. You can usually work up to 24 hours/week off campus. Keep every enrolment letter and transcript; you'll need them for the PGWP application within 180 days of your final marks.",
      linkUrl: pgwpUrl,
    },
  ],
  checklistTitle: "Document checklist",
  checklist: [
    "Letter of acceptance (LOA) from a designated learning institution (DLI)",
    "Provincial Attestation Letter (PAL) — your institution usually requests it for you",
    "Proof of funds: first-year tuition + cost-of-living amount + travel",
    "Valid passport (covering your whole intended stay if possible)",
    "Statement of purpose / study plan letter",
    "Academic transcripts and certificates (with certified translations)",
    "Language test results if your school or visa office asks for them",
    "Medical exam (depending on country of residence) and biometrics",
    "Custodian declaration only if under 18",
  ],
  boxesTitle: "Why study permits get refused",
  boxesIntro:
    "Refusal rates vary enormously by country and program type. The four patterns below cover most refusals — write your application to pre-empt them.",
  boxes: [
    {
      title: "Financial insufficiency",
      detail:
        "The single most common refusal. Show stable, traceable funds — a GIC (Guaranteed Investment Certificate) from a Canadian bank is the cleanest evidence; large unexplained recent deposits are a red flag.",
    },
    {
      title: "Purpose of visit / ties to home country",
      detail:
        "The officer must believe you'll leave if required. A focused study plan that explains why THIS program, why Canada, and how it fits your career back home matters more than people expect — even though most students do intend to stay via PGWP, the permit is assessed as a temporary visa.",
    },
    {
      title: "Program–career mismatch",
      detail:
        "A 35-year-old manager applying for a 1-year hospitality certificate raises questions. If you're changing fields or studying 'below' your existing credential, address it head-on in the study plan.",
    },
    {
      title: "Incomplete or inconsistent documents",
      detail:
        "Dates that don't line up, missing translations, or an expired language test. Triple-check before submitting — a refusal stays on your record and must be declared in future applications.",
    },
  ],
  warning: {
    pre: "Study-permit rules changed repeatedly in 2024–2025 (caps, PALs, fund amounts, PGWP fields). Verify every number on the linked IRCC pages before acting, and check our ",
    linkText: "policy updates",
    post: " page for anything new.",
  },
  back: "← Back to your roadmap",
};

const fr: GuideContent = {
  kicker: "Guide",
  title: "Le permis d'études, étape par étape",
  intro:
    "Pour la plupart des gens qui ne sont pas encore admissibles à Entrée express, étudier au Canada est la rampe d'accès : permis d'études → PTPD → expérience de travail canadienne → RP (et pour les titulaires d'un passeport de Hong Kong, directement le volet A après l'obtention du diplôme). Ce guide couvre le permis lui-même — l'étape où la plupart des plans échouent.",
  facts: [
    { label: "Échéancier typique", value: "6 à 12 mois avant la rentrée" },
    { label: "Fonds à démontrer", value: `${funds} $ + droits de scolarité de 1re année` },
    { label: "Droits de scolarité", value: `${tuitionMin} $–${tuitionMax} $/an (étudiants étrangers)` },
  ],
  stepsTitle: "Les sept étapes",
  steps: [
    {
      title: "Choisissez le programme pour la sortie, pas pour l'entrée",
      body: "Si votre objectif est la RP, le programme doit mener à un permis de travail postdiplôme (PTPD). Les diplômes universitaires (baccalauréat, maîtrise, doctorat) sont sûrs. Les diplômes collégiaux doivent être dans un domaine lié aux pénuries de main-d'œuvre — vérifiez la liste des domaines admissibles AVANT de payer un dépôt. Une maîtrise de 8 mois et plus donne un PTPD complet de 3 ans; au collégial, il faut 2 ans pour le permis de 3 ans. Attention aussi à la langue : le PTPD exige NCLC 7 (université) ou NCLC 5 (collège).",
      linkUrl: pgwpUrl,
    },
    {
      title: "Obtenez la lettre d'acceptation",
      body: "Postulez à 2 ou 3 établissements d'enseignement désignés (EED). Les frais de demande sont de 100 $ à 250 $ chacun. Visez une lettre d'acceptation 4 à 6 mois avant la rentrée visée (rentrée de septembre : postulez de janvier à mars; rentrée de janvier : d'août à septembre).",
      linkUrl: permitUrl,
    },
    {
      title: "Lettre d'attestation provinciale (LAP)",
      body: "Depuis 2024, la plupart des demandeurs ont besoin d'une LAP prouvant qu'ils entrent dans l'allocation provinciale de permis d'études. Votre établissement la demande après votre acceptation et (souvent) le paiement d'un dépôt. Les étudiants de maîtrise/doctorat et certaines catégories en sont exemptés. Prévoyez 2 à 6 semaines.",
      linkUrl: permitUrl,
    },
    {
      title: "Assemblez la preuve de fonds",
      body: `Vous devez démontrer les droits de scolarité de première année (reçus à l'appui) plus ${funds} $ de frais de subsistance (demandeur seul hors Québec) plus les frais de voyage. Preuves pratiques : un CPG canadien de ${funds} $, 4 à 6 mois de relevés bancaires, des lettres de répondants avec leurs propres preuves. Les fonds doivent paraître stables — pas déposés la veille.`,
      linkUrl: fundsUrl,
    },
    {
      title: "Présentez la demande en ligne et faites la biométrie",
      body: `Les frais sont de ${fees.studyPermit} $ plus ${fees.biometricsPerPerson} $ de biométrie. Après l'envoi, vous recevrez une lettre d'instructions biométriques — prenez rendez-vous vite, la fenêtre de 30 jours est réelle. Un examen médical est requis pour certains pays ou si vous travaillerez en santé ou en garde d'enfants.`,
      linkUrl: permitUrl,
    },
    {
      title: "Attendez le traitement — et prévoyez le plan B",
      body: "Les délais varient énormément selon le pays (de quelques semaines à plusieurs mois) — consultez l'outil de délais de traitement pour votre pays. Si la rentrée glisse, les établissements peuvent généralement reporter d'une session. Ne réservez pas de voyage non remboursable avant l'approbation.",
      linkUrl: timesUrl,
    },
    {
      title: "Après l'arrivée : protégez votre route vers la RP",
      body: "Restez inscrit à temps plein — passer à temps partiel peut annuler votre admissibilité au PTPD. Vous pouvez généralement travailler jusqu'à 24 h/semaine hors campus. Gardez chaque attestation d'inscription et relevé de notes; il les faudra pour la demande de PTPD dans les 180 jours suivant vos notes finales.",
      linkUrl: pgwpUrl,
    },
  ],
  checklistTitle: "Liste de documents",
  checklist: [
    "Lettre d'acceptation d'un établissement d'enseignement désigné (EED)",
    "Lettre d'attestation provinciale (LAP) — votre établissement la demande généralement pour vous",
    "Preuve de fonds : scolarité de 1re année + frais de subsistance + voyage",
    "Passeport valide (couvrant idéalement tout le séjour prévu)",
    "Lettre d'intention / plan d'études",
    "Relevés de notes et diplômes (avec traductions certifiées)",
    "Résultats de test linguistique si l'école ou le bureau des visas l'exige",
    "Examen médical (selon le pays de résidence) et biométrie",
    "Déclaration de gardien seulement si moins de 18 ans",
  ],
  boxesTitle: "Pourquoi les permis d'études sont refusés",
  boxesIntro:
    "Les taux de refus varient énormément selon le pays et le type de programme. Les quatre motifs ci-dessous couvrent la plupart des refus — rédigez votre demande pour les désamorcer.",
  boxes: [
    {
      title: "Fonds insuffisants",
      detail:
        "Le refus le plus fréquent. Montrez des fonds stables et traçables — un CPG d'une banque canadienne est la preuve la plus propre; les gros dépôts récents inexpliqués sont un signal d'alarme.",
    },
    {
      title: "But de la visite / attaches au pays d'origine",
      detail:
        "L'agent doit croire que vous partirez si nécessaire. Un plan d'études ciblé expliquant pourquoi CE programme, pourquoi le Canada, et comment cela sert votre carrière chez vous compte plus qu'on ne le pense — même si la plupart des étudiants comptent rester via le PTPD, le permis est évalué comme un visa temporaire.",
    },
    {
      title: "Inadéquation programme–carrière",
      detail:
        "Un gestionnaire de 35 ans qui demande un certificat d'hôtellerie d'un an soulève des questions. Si vous changez de domaine ou étudiez « en dessous » de votre diplôme actuel, abordez-le franchement dans le plan d'études.",
    },
    {
      title: "Documents incomplets ou incohérents",
      detail:
        "Dates qui ne concordent pas, traductions manquantes, test linguistique expiré. Vérifiez trois fois avant d'envoyer — un refus reste au dossier et doit être déclaré dans les demandes futures.",
    },
  ],
  warning: {
    pre: "Les règles du permis d'études ont changé à répétition en 2024–2025 (plafonds, LAP, montants, domaines PTPD). Vérifiez chaque chiffre sur les pages d'IRCC liées avant d'agir, et consultez notre page ",
    linkText: "mises à jour des politiques",
    post: " pour toute nouveauté.",
  },
  back: "← Retour à votre feuille de route",
};

const zhHant: GuideContent = {
  kicker: "指南",
  title: "學習許可逐步指南",
  intro:
    "對大多數暫未符合快速通道資格的人來說，留學是進入加拿大的跳板：學習許可 → 畢業工簽（PGWP）→ 加拿大工作經驗 → 永居（持香港護照者畢業後可直接申請 Stream A）。本指南講解學習許可本身 — 大多數計劃正是敗在這一步。",
  facts: [
    { label: "典型時間表", value: "開學前 6–12 個月開始準備" },
    { label: "須證明資金", value: `$${funds} + 首年學費` },
    { label: "學費實況", value: `國際生每年 $${tuitionMin}–$${tuitionMax}` },
  ],
  stepsTitle: "七個步驟",
  steps: [
    {
      title: "選課程要看出口，不是入口",
      body: "如果目標是永居，課程必須能銜接畢業工簽（PGWP）。大學學位（學士、碩士、博士）穩妥；學院文憑則必須屬於長期短缺職業相關科系 — 交任何訂金之前先核對最新合資格科系清單。8 個月以上的碩士課程可獲足 3 年 PGWP；學院課程須讀滿 2 年才有 3 年工簽。語言也要留意：PGWP 要求 CLB 7（大學）或 CLB 5（學院）。",
      linkUrl: pgwpUrl,
    },
    {
      title: "取得錄取信（LOA）",
      body: "向 2–3 間指定教育機構（DLI）申請，每間申請費約 $100–$250。爭取在目標入學期前至少 4–6 個月拿到錄取信（9 月入學：1–3 月申請；1 月入學：8–9 月申請）。",
      linkUrl: permitUrl,
    },
    {
      title: "省級證明信（PAL）",
      body: "自 2024 年起，大多數申請人需要 PAL 證明自己在省份的學簽配額內。接受錄取並（通常）繳交訂金後，學校會代為申請。碩士／博士生及部分類別獲豁免。預留 2–6 星期。",
      linkUrl: permitUrl,
    },
    {
      title: "備妥資金證明",
      body: `須證明首年學費（已預繳的保留收據）加 $${funds} 生活費（魁北克以外單人申請）加旅費。實用做法：加拿大銀行 $${funds} 的 GIC、4–6 個月銀行月結單、資助人信件連同其資金證明。資金須看來穩定 — 不能是昨天才存入。`,
      linkUrl: fundsUrl,
    },
    {
      title: "網上遞交並完成生物識別",
      body: `許可費 $${fees.studyPermit}，生物識別 $${fees.biometricsPerPerson}。遞交後會收到生物識別指示信 — 盡快預約，30 日期限是真的。部分國家或日後在醫療／託兒行業工作者須體檢。`,
      linkUrl: permitUrl,
    },
    {
      title: "等候審批 — 並準備後備方案",
      body: "審批時間因國家而異（數週至數月）— 用官方處理時間工具查您所在國家。若趕不上開學，學校通常可延後一個學期。批出前別訂不可退款的機票。",
      linkUrl: timesUrl,
    },
    {
      title: "抵埗後：保住您的永居跑道",
      body: "保持全日制在讀 — 轉兼讀可能令 PGWP 資格作廢。校外通常每週可工作至多 24 小時。保留每封在讀證明及成績單；最終成績公布後 180 日內申請 PGWP 時都用得上。",
      linkUrl: pgwpUrl,
    },
  ],
  checklistTitle: "文件清單",
  checklist: [
    "指定教育機構（DLI）的錄取信（LOA）",
    "省級證明信（PAL）— 通常由學校代為申請",
    "資金證明：首年學費 + 生活費 + 旅費",
    "有效護照（最好涵蓋整個預計逗留期）",
    "目的陳述／學習計劃書",
    "成績單及證書（附認證翻譯）",
    "學校或簽證處要求時的語言成績",
    "體檢（視居住國家而定）及生物識別",
    "未滿 18 歲才需要監護人聲明",
  ],
  boxesTitle: "學簽被拒的原因",
  boxesIntro: "拒簽率因國家和課程類型差異極大。以下四種情況涵蓋大多數拒簽 — 撰寫申請時逐一預防。",
  boxes: [
    {
      title: "資金不足",
      detail:
        "最常見的拒簽原因。展示穩定、可追溯的資金 — 加拿大銀行的 GIC 是最乾淨的證據；來歷不明的大額近期存款是危險信號。",
    },
    {
      title: "訪問目的／與原居地的聯繫",
      detail:
        "簽證官須相信您在需要時會離開。一份聚焦的學習計劃 — 為何是這個課程、為何是加拿大、如何配合您在原居地的事業 — 比想像中重要。雖然大多數學生確實打算經 PGWP 留下，但學簽是按臨時簽證審理的。",
    },
    {
      title: "課程與職業不匹配",
      detail:
        "35 歲的經理申請一年制款待業證書會引起疑問。如果您轉行或修讀「低於」現有學歷的課程，請在學習計劃中正面解釋。",
    },
    {
      title: "文件不全或互相矛盾",
      detail:
        "日期對不上、欠翻譯、語言成績過期。遞交前反覆核對 — 拒簽紀錄會留底，日後申請都須申報。",
    },
  ],
  warning: {
    pre: "學簽規則在 2024–2025 年間屢次更改（配額、PAL、資金額、PGWP 科系）。行動前請在所附 IRCC 頁面核實每個數字，並到我們的",
    linkText: "政策更新",
    post: "頁面查看最新變動。",
  },
  back: "← 返回您的路線圖",
};

const zhHans: GuideContent = {
  kicker: "指南",
  title: "学习许可分步指南",
  intro:
    "对大多数暂不符合快速通道资格的人来说，留学是进入加拿大的跳板：学习许可 → 毕业工签（PGWP）→ 加拿大工作经验 → 永居（持香港护照者毕业后可直接申请 Stream A）。本指南讲解学习许可本身 — 大多数计划正是败在这一步。",
  facts: [
    { label: "典型时间表", value: "开学前 6–12 个月开始准备" },
    { label: "须证明资金", value: `$${funds} + 首年学费` },
    { label: "学费实况", value: `国际生每年 $${tuitionMin}–$${tuitionMax}` },
  ],
  stepsTitle: "七个步骤",
  steps: [
    {
      title: "选课程要看出口，不是入口",
      body: "如果目标是永居，课程必须能衔接毕业工签（PGWP）。大学学位（学士、硕士、博士）稳妥；学院文凭则必须属于长期短缺职业相关专业 — 交任何订金之前先核对最新合资格专业清单。8 个月以上的硕士课程可获足 3 年 PGWP；学院课程须读满 2 年才有 3 年工签。语言也要留意：PGWP 要求 CLB 7（大学）或 CLB 5（学院）。",
      linkUrl: pgwpUrl,
    },
    {
      title: "取得录取信（LOA）",
      body: "向 2–3 所指定教育机构（DLI）申请，每所申请费约 $100–$250。争取在目标入学期前至少 4–6 个月拿到录取信（9 月入学：1–3 月申请；1 月入学：8–9 月申请）。",
      linkUrl: permitUrl,
    },
    {
      title: "省级证明信（PAL）",
      body: "自 2024 年起，大多数申请人需要 PAL 证明自己在省份的学签配额内。接受录取并（通常）缴纳订金后，学校会代为申请。硕士／博士生及部分类别获豁免。预留 2–6 周。",
      linkUrl: permitUrl,
    },
    {
      title: "备齐资金证明",
      body: `须证明首年学费（已预缴的保留收据）加 $${funds} 生活费（魁北克以外单人申请）加旅费。实用做法：加拿大银行 $${funds} 的 GIC、4–6 个月银行流水、资助人信件连同其资金证明。资金须看起来稳定 — 不能是昨天才存入。`,
      linkUrl: fundsUrl,
    },
    {
      title: "在线递交并完成生物识别",
      body: `许可费 $${fees.studyPermit}，生物识别 $${fees.biometricsPerPerson}。递交后会收到生物识别指示信 — 尽快预约，30 天期限是真的。部分国家或日后在医疗／托儿行业工作者须体检。`,
      linkUrl: permitUrl,
    },
    {
      title: "等候审批 — 并准备后备方案",
      body: "审批时间因国家而异（数周至数月）— 用官方处理时间工具查您所在国家。若赶不上开学，学校通常可延后一个学期。获批前别订不可退款的机票。",
      linkUrl: timesUrl,
    },
    {
      title: "抵达后：保住您的永居跑道",
      body: "保持全日制在读 — 转兼读可能使 PGWP 资格作废。校外通常每周可工作至多 24 小时。保留每份在读证明及成绩单；最终成绩公布后 180 天内申请 PGWP 时都用得上。",
      linkUrl: pgwpUrl,
    },
  ],
  checklistTitle: "文件清单",
  checklist: [
    "指定教育机构（DLI）的录取信（LOA）",
    "省级证明信（PAL）— 通常由学校代为申请",
    "资金证明：首年学费 + 生活费 + 旅费",
    "有效护照（最好涵盖整个预计停留期）",
    "目的陈述／学习计划书",
    "成绩单及证书（附认证翻译）",
    "学校或签证处要求时的语言成绩",
    "体检（视居住国家而定）及生物识别",
    "未满 18 岁才需要监护人声明",
  ],
  boxesTitle: "学签被拒的原因",
  boxesIntro: "拒签率因国家和课程类型差异极大。以下四种情况涵盖大多数拒签 — 撰写申请时逐一预防。",
  boxes: [
    {
      title: "资金不足",
      detail:
        "最常见的拒签原因。展示稳定、可追溯的资金 — 加拿大银行的 GIC 是最干净的证据；来历不明的大额近期存款是危险信号。",
    },
    {
      title: "访问目的／与原居地的联系",
      detail:
        "签证官须相信您在需要时会离开。一份聚焦的学习计划 — 为何是这个课程、为何是加拿大、如何配合您在原居地的事业 — 比想象中重要。虽然大多数学生确实打算经 PGWP 留下，但学签是按临时签证审理的。",
    },
    {
      title: "课程与职业不匹配",
      detail:
        "35 岁的经理申请一年制酒店管理证书会引起疑问。如果您转行或修读“低于”现有学历的课程，请在学习计划中正面解释。",
    },
    {
      title: "文件不全或互相矛盾",
      detail:
        "日期对不上、缺翻译、语言成绩过期。递交前反复核对 — 拒签记录会留底，日后申请都须申报。",
    },
  ],
  warning: {
    pre: "学签规则在 2024–2025 年间屡次更改（配额、PAL、资金额、PGWP 专业）。行动前请在所附 IRCC 页面核实每个数字，并到我们的",
    linkText: "政策更新",
    post: "页面查看最新变动。",
  },
  back: "← 返回您的路线图",
};

export const studyPermitGuide: Record<Locale, GuideContent> = {
  en,
  fr,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};
