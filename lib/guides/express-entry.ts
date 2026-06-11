import type { Locale } from "@/lib/i18n";
import type { GuideContent } from "@/lib/guides/types";
import { fees, sources } from "@/lib/rules/parameters";

const feeLine = `$${fees.eePrincipalProcessing} + $${fees.eeRightOfPermanentResidence}`;

const langUrl = sources.languageEquivalency.url;
const fswUrl = sources.fsw.url;
const roundsUrl = sources.drawRounds.url;
const categoryUrl = sources.categoryBased.url;
const timesUrl = sources.processingTimes.url;

const en: GuideContent = {
  kicker: "Guide",
  title: "The Express Entry profile, step by step",
  intro:
    "From zero documents to permanent residence under FSW, CEC or FST. Use the planner first to confirm which program fits and how your score compares to recent cutoffs.",
  facts: [
    { label: "Profile cost", value: "Free (documents cost money)" },
    { label: "Government fees at application", value: `${feeLine} per adult` },
    { label: "Service standard after ITA", value: "6 months (often longer)" },
  ],
  stepsTitle: "The six steps",
  steps: [
    {
      title: "Book the language test first — it's the long pole",
      body: "IELTS General Training, CELPIP-General or PTE Core for English; TEF/TCF Canada for French. Seats in busy cities book out 4–8 weeks ahead, results take ~2 weeks. Results are valid 2 years and must be valid on the day you're invited AND the day you submit. If you're within 30 points of a cutoff, budget for a retake — language is the cheapest big point gain.",
      linkUrl: langUrl,
    },
    {
      title: "Start the ECA in parallel (foreign education only)",
      body: "WES is fastest for most countries (~$260, a few weeks once documents arrive); IQAS, ICES, CES and others are also designated. Your university must usually send transcripts directly — that's the slow part. The ECA is valid 5 years. Education still earns CRS points even under CEC, so assess it anyway.",
      linkUrl: fswUrl,
    },
    {
      title: "Create the profile — accuracy beats speed",
      body: "The profile itself is free and takes an hour if your documents are ready. Every claim you make (work history dates, NOC/TEER code, scores) must later be PROVEN. Choosing the right NOC code matters most: read the lead statement and duties of the code, not just the title — a mismatch between your reference letters and the code's duties is a top refusal reason.",
      linkUrl: roundsUrl,
    },
    {
      title: "While in the pool: keep improving, keep valid",
      body: "Your profile lasts 12 months; you can update it anytime (new test scores, new work anniversary, nomination). A provincial nomination (+600) or hitting a work-experience anniversary recalculates your score automatically. Watch category-based draws — French ability or an in-demand occupation can invite you at far lower scores than general rounds.",
      linkUrl: categoryUrl,
    },
    {
      title: "After the ITA: the 60-day sprint",
      body: `An invitation starts a 60-day clock to submit a complete application: police certificates from every country you've lived in 6+ months since age 18 (start early — some take months; you can decline the ITA and re-enter the pool if you're not ready), upfront medical exam, employment reference letters on company letterhead listing duties/hours/salary, proof of funds, and fees (${feeLine} per adult).`,
      linkUrl: roundsUrl,
    },
    {
      title: "Processing to landing",
      body: "IRCC's service standard is 6 months from a complete application; reality varies. You'll do biometrics, then wait. After approval you get a COPR — landing (or the in-Canada confirmation portal) makes you a permanent resident. Your citizenship clock starts the day you land, with half-credit for time already spent in Canada before PR.",
      linkUrl: timesUrl,
    },
  ],
  mistakesTitle: "The five mistakes that sink applications",
  mistakes: [
    "Reference letters that don't list duties matching your NOC code's lead statement",
    "Police certificate ordered too late for a country with slow issuance",
    "Funds dipping below the threshold mid-process (must be maintained until visa issuance)",
    "Claiming full-time work that overlaps with full-time study (doesn't count for CEC)",
    "Letting the language test expire between profile creation and ITA",
  ],
  warning: {
    pre: "Draw patterns shift constantly — recent rounds have favoured the Canadian Experience Class, provincial nominees, French speakers and category occupations. Check the live cutoffs on our ",
    linkText: "updates page",
    post: " before banking on a general draw.",
  },
  back: "← Back to your roadmap",
};

const fr: GuideContent = {
  kicker: "Guide",
  title: "Le profil Entrée express, étape par étape",
  intro:
    "De zéro document à la résidence permanente sous TQF, CEC ou MSF. Utilisez d'abord le planificateur pour confirmer quel programme convient et comment votre score se compare aux seuils récents.",
  facts: [
    { label: "Coût du profil", value: "Gratuit (les documents, eux, coûtent)" },
    { label: "Frais gouvernementaux à la demande", value: `${feeLine} par adulte` },
    { label: "Norme de service après l'IPD", value: "6 mois (souvent plus)" },
  ],
  stepsTitle: "Les six étapes",
  steps: [
    {
      title: "Réservez d'abord le test de langue — c'est le chemin critique",
      body: "IELTS General Training, CELPIP-General ou PTE Core pour l'anglais; TEF/TCF Canada pour le français. Dans les grandes villes, les places partent 4 à 8 semaines d'avance; les résultats prennent ~2 semaines. Validité : 2 ans — et le test doit être valide le jour de l'invitation ET le jour de l'envoi. À moins de 30 points d'un seuil, prévoyez une reprise : la langue est le gain de points le moins cher.",
      linkUrl: langUrl,
    },
    {
      title: "Lancez l'EDE en parallèle (études étrangères seulement)",
      body: "WES est le plus rapide pour la plupart des pays (~260 $, quelques semaines une fois les documents reçus); IQAS, ICES, CES et d'autres sont aussi désignés. Votre université doit généralement envoyer les relevés directement — c'est l'étape lente. L'EDE vaut 5 ans. Les études donnent des points SCG même sous la CEC : faites-la évaluer quand même.",
      linkUrl: fswUrl,
    },
    {
      title: "Créez le profil — l'exactitude prime sur la vitesse",
      body: "Le profil est gratuit et prend une heure si vos documents sont prêts. Chaque affirmation (dates d'emploi, code CNP/FEER, résultats) devra être PROUVÉE. Le bon code CNP compte le plus : lisez l'énoncé principal et les fonctions du code, pas seulement le titre — un écart entre vos lettres d'emploi et les fonctions du code est une cause majeure de refus.",
      linkUrl: roundsUrl,
    },
    {
      title: "Dans le bassin : continuez d'améliorer, restez valide",
      body: "Le profil dure 12 mois et se met à jour en tout temps (nouveaux résultats, anniversaire d'expérience, désignation). Une désignation provinciale (+600) ou un anniversaire d'expérience recalcule le score automatiquement. Surveillez les tirages par catégorie — le français ou une profession en demande peut vous faire inviter à un score bien plus bas.",
      linkUrl: categoryUrl,
    },
    {
      title: "Après l'IPD : le sprint de 60 jours",
      body: `L'invitation déclenche 60 jours pour soumettre une demande complète : certificats de police de chaque pays habité 6 mois et plus depuis vos 18 ans (commencez tôt — certains prennent des mois; vous pouvez décliner l'IPD et revenir au bassin), examen médical, lettres d'emploi sur papier à en-tête détaillant fonctions/heures/salaire, preuve de fonds, et les frais (${feeLine} par adulte).`,
      linkUrl: roundsUrl,
    },
    {
      title: "Du traitement à l'établissement",
      body: "La norme de service d'IRCC est de 6 mois pour une demande complète; la réalité varie. Biométrie, puis attente. Après l'approbation, vous recevez une CRP — l'arrivée (ou le portail de confirmation au Canada) fait de vous un résident permanent. Le compteur de citoyenneté démarre au jour de l'établissement, avec demi-crédit pour le temps déjà passé au Canada avant la RP.",
      linkUrl: timesUrl,
    },
  ],
  mistakesTitle: "Les cinq erreurs qui coulent les demandes",
  mistakes: [
    "Lettres d'emploi dont les fonctions ne correspondent pas à l'énoncé principal du code CNP",
    "Certificat de police commandé trop tard pour un pays à délivrance lente",
    "Fonds passant sous le seuil en cours de traitement (à maintenir jusqu'à la délivrance du visa)",
    "Travail à temps plein déclaré qui chevauche des études à temps plein (ne compte pas pour la CEC)",
    "Test de langue qui expire entre la création du profil et l'IPD",
  ],
  warning: {
    pre: "Les tendances de tirage changent constamment — les rondes récentes favorisent la CEC, les candidats des provinces, les francophones et les professions par catégorie. Vérifiez les seuils en direct sur notre page ",
    linkText: "mises à jour",
    post: " avant de miser sur un tirage général.",
  },
  back: "← Retour à votre feuille de route",
};

const zhHant: GuideContent = {
  kicker: "指南",
  title: "快速通道檔案逐步指南",
  intro:
    "由零文件到經 FSW、CEC 或 FST 取得永居。請先用規劃工具確認哪個項目適合您，以及您的分數與近期分數線的差距。",
  facts: [
    { label: "建檔費用", value: "免費（文件本身要花錢）" },
    { label: "申請時的政府費用", value: `每名成人 ${feeLine}` },
    { label: "獲邀後服務標準", value: "6 個月（常會更長）" },
  ],
  stepsTitle: "六個步驟",
  steps: [
    {
      title: "先報語言試 — 這是最花時間的一環",
      body: "英語：IELTS General Training、CELPIP-General 或 PTE Core；法語：TEF／TCF Canada。大城市考位常提前 4–8 週爆滿，出成績約 2 週。成績有效期 2 年，而且在獲邀當日和遞交當日都必須有效。如果您距離分數線 30 分以內，預算重考 — 語言是最划算的大幅加分途徑。",
      linkUrl: langUrl,
    },
    {
      title: "同步啟動學歷認證 ECA（僅海外學歷）",
      body: "多數國家以 WES 最快（約 $260，文件齊後數週）；IQAS、ICES、CES 等亦獲指定。通常須由您的大學直接寄送成績單 — 這是最慢的一步。ECA 有效期 5 年。即使走 CEC，學歷仍計 CRS 分，建議照樣認證。",
      linkUrl: fswUrl,
    },
    {
      title: "建立檔案 — 準確比快更重要",
      body: "建檔免費，文件齊全約一小時完成。檔案中每項聲明（工作日期、NOC／TEER 代碼、成績）日後都必須能證明。選對 NOC 代碼最關鍵：要讀代碼的主要職責描述，不只看職銜 — 工作證明信與代碼職責不符是最常見的拒簽原因之一。",
      linkUrl: roundsUrl,
    },
    {
      title: "在池中等待時：持續提升、保持有效",
      body: "檔案有效 12 個月，可隨時更新（新語言成績、工作滿一年、省提名）。省提名（+600）或工作年資到期會自動重算分數。留意類別抽籤 — 法語能力或短缺職業可以用遠低於普通輪的分數獲邀。",
      linkUrl: categoryUrl,
    },
    {
      title: "獲邀之後：60 日衝刺",
      body: `獲邀後有 60 日遞交完整申請：18 歲後居住滿 6 個月的每個國家的無犯罪證明（趁早辦 — 部分國家要數月；未準備好可拒絕邀請重回池中）、前置體檢、列明職責／工時／薪金的公司信頭工作證明信、資金證明，以及費用（每名成人 ${feeLine}）。`,
      linkUrl: roundsUrl,
    },
    {
      title: "由審批到登陸",
      body: "IRCC 對完整申請的服務標準是 6 個月；實際因案而異。先做生物識別，然後等待。獲批後收到 COPR — 登陸（或加拿大境內確認門戶）那天起您就是永久居民。入籍時鐘亦由登陸日起跳，永居前在加時間可獲一半折算。",
      linkUrl: timesUrl,
    },
  ],
  mistakesTitle: "最致命的五個錯誤",
  mistakes: [
    "工作證明信的職責與 NOC 代碼主要職責描述不符",
    "無犯罪證明太遲申請，遇上出證慢的國家",
    "資金在審批中途跌穿門檻（須維持至簽發為止）",
    "申報的全職工作與全日制讀書時間重疊（CEC 不計）",
    "語言成績在建檔與獲邀之間過期",
  ],
  warning: {
    pre: "抽籤模式不斷變化 — 近期輪次偏向 CEC、省提名、法語人士及類別職業。把希望寄託在普通輪之前，先到我們的",
    linkText: "更新頁面",
    post: "查看實時分數線。",
  },
  back: "← 返回您的路線圖",
};

const zhHans: GuideContent = {
  kicker: "指南",
  title: "快速通道档案分步指南",
  intro:
    "从零文件到经 FSW、CEC 或 FST 取得永居。请先用规划工具确认哪个项目适合您，以及您的分数与近期分数线的差距。",
  facts: [
    { label: "建档费用", value: "免费（文件本身要花钱）" },
    { label: "申请时的政府费用", value: `每名成人 ${feeLine}` },
    { label: "获邀后服务标准", value: "6 个月（常会更长）" },
  ],
  stepsTitle: "六个步骤",
  steps: [
    {
      title: "先报语言考试 — 这是最花时间的一环",
      body: "英语：IELTS General Training、CELPIP-General 或 PTE Core；法语：TEF／TCF Canada。大城市考位常提前 4–8 周满员，出成绩约 2 周。成绩有效期 2 年，而且在获邀当日和递交当日都必须有效。如果您距离分数线 30 分以内，预算重考 — 语言是最划算的大幅加分途径。",
      linkUrl: langUrl,
    },
    {
      title: "同步启动学历认证 ECA（仅海外学历）",
      body: "多数国家以 WES 最快（约 $260，文件齐后数周）；IQAS、ICES、CES 等亦获指定。通常须由您的大学直接寄送成绩单 — 这是最慢的一步。ECA 有效期 5 年。即使走 CEC，学历仍计 CRS 分，建议照样认证。",
      linkUrl: fswUrl,
    },
    {
      title: "建立档案 — 准确比快更重要",
      body: "建档免费，文件齐全约一小时完成。档案中每项声明（工作日期、NOC／TEER 代码、成绩）日后都必须能证明。选对 NOC 代码最关键：要读代码的主要职责描述，不只看职衔 — 工作证明信与代码职责不符是最常见的拒签原因之一。",
      linkUrl: roundsUrl,
    },
    {
      title: "在池中等待时：持续提升、保持有效",
      body: "档案有效 12 个月，可随时更新（新语言成绩、工作满一年、省提名）。省提名（+600）或工作年资到期会自动重算分数。留意类别抽签 — 法语能力或短缺职业可以用远低于普通轮的分数获邀。",
      linkUrl: categoryUrl,
    },
    {
      title: "获邀之后：60 天冲刺",
      body: `获邀后有 60 天递交完整申请：18 岁后居住满 6 个月的每个国家的无犯罪证明（趁早办 — 部分国家要数月；未准备好可拒绝邀请重回池中）、前置体检、列明职责／工时／薪资的公司抬头工作证明信、资金证明，以及费用（每名成人 ${feeLine}）。`,
      linkUrl: roundsUrl,
    },
    {
      title: "从审批到登陆",
      body: "IRCC 对完整申请的服务标准是 6 个月；实际因案而异。先做生物识别，然后等待。获批后收到 COPR — 登陆（或加拿大境内确认门户）那天起您就是永久居民。入籍时钟亦由登陆日起算，永居前在加时间可获一半折算。",
      linkUrl: timesUrl,
    },
  ],
  mistakesTitle: "最致命的五个错误",
  mistakes: [
    "工作证明信的职责与 NOC 代码主要职责描述不符",
    "无犯罪证明申请太迟，遇上出证慢的国家",
    "资金在审批中途跌破门槛（须维持至签发为止）",
    "申报的全职工作与全日制读书时间重叠（CEC 不计）",
    "语言成绩在建档与获邀之间过期",
  ],
  warning: {
    pre: "抽签模式不断变化 — 近期轮次偏向 CEC、省提名、法语人士及类别职业。把希望寄托在普通轮之前，先到我们的",
    linkText: "更新页面",
    post: "查看实时分数线。",
  },
  back: "← 返回您的路线图",
};

export const expressEntryGuide: Record<Locale, GuideContent> = {
  en,
  fr,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};
