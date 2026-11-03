/**
 * Dashboard text overrides that replace Medusa's name with Equidentum.
 *
 * The admin merges these over its built-in translations, so only the strings
 * that name the platform are listed. Anything not here keeps the stock text.
 */
const en = {
  login: {
    title: "Welcome to Equidentum",
  },
  invite: {
    title: "Welcome to Equidentum",
    successHint: "Get started with Equidentum Admin right away.",
    successAction: "Start Equidentum Admin",
  },
  orders: {
    refund: {
      systemPaymentDesc:
        "One or more of your payments is a system payment. Be aware, that captures and refunds are not handled by Equidentum for such payments.",
    },
  },
  profile: {
    edit: {
      usageInsightsHint:
        "Share anonymous usage insights with the platform's developers. You can read more about what is collected and how it is used in the <0>documentation</0>.",
    },
  },
  translations: {
    subtitle: "Manage translations of your data in Equidentum",
  },
  apiKeyManagement: {
    create: {
      createSecretHint:
        "Create a new secret API key to access the Equidentum API as an authenticated admin user.",
    },
  },
  workflowExecutions: {
    subtitle: "View and keep track of workflow executions in your Equidentum store.",
  },
  notifications: {
    accessibility: {
      description: "Notifications about Equidentum activities will be listed here.",
    },
  },
  auth: {
    login: {
      noProviders: "Register an auth provider in the backend config to be able to login",
    },
  },
}

const ar = {
  login: {
    title: "مرحبًا بك في Equidentum",
  },
  invite: {
    title: "مرحبًا بك في Equidentum",
    successHint: "ابدأ باستخدام Equidentum الآن.",
    successAction: "ابدأ Equidentum",
  },
  orders: {
    refund: {
      systemPaymentDesc:
        "واحدة أو أكثر من دفعاتك هي دفعة نظام. كن على علم بأن الاستلام والاسترداد لا يتم التعامل معها بواسطة Equidentum لمثل هذه الدفعات.",
    },
  },
  profile: {
    edit: {
      usageInsightsHint:
        "شارك رؤى الاستخدام مع مطوري المنصة. يمكنك قراءة المزيد حول ما يتم جمعه وكيفية استخدامه في <0>التوثيق</0>.",
    },
  },
  apiKeyManagement: {
    create: {
      createSecretHint: "إنشاء مفتاح API سري جديد للوصول إلى API Equidentum كمستخدم إداري مصادق.",
    },
  },
  workflowExecutions: {
    subtitle: "عرض وتتبع تنفيذات سير العمل في متجر Equidentum الخاص بك.",
  },
  notifications: {
    accessibility: {
      description: "سيتم سرد الإشعارات حول أنشطة Equidentum هنا.",
    },
  },
}

export default {
  en: { translation: en },
  enGB: { translation: en },
  ar: { translation: ar },
}
