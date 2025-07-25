import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languageDetector";

const resources = {
  en: {
    translation: {
      generics: {
        submit: "Submit",
        startupfuel: "Startup Fuel",
        signout: "Sign out",
        reload: "Reload",
        of: "of",
        cancel: "Cancel",
        close: "Close",
      },
      error: {
        validator: {
          email: "Invalid email",
          password: {
            lowerCase: "Password must include a lowercase",
            upperCase: "Password must include a uppercase",
            max: "Password must have a max length of 20",
            min: "Password must have a min length of 8",
            number: "Password must have a number",
            specialCharacter: "Password must have a special character",
            mismatch: "Passwords must match",
          },
        },
        network: {
          generic: "Error retrieving information",
        },
      },
      login: {
        title: "Login",
        email: {
          label: "Email",
          placeholder: "joe@doe.com",
        },
        password: {
          label: "Password",
          placeholder: "*******",
        },
        toast: {
          success: "Login successfully",
          error: "Error login account",
        },
        signup: "Are you a new user?",
      },
      signup: {
        title: "Sign up",
        name: {
          label: "Name",
          placeholder: "Joe Doe",
        },
        email: {
          label: "Email",
          placeholder: "joe@doe.com",
        },
        password: {
          label: "Password",
          placeholder: "*******",
        },
        confirmPassword: {
          label: "Confirm Password",
          placeholder: "*******",
        },
        toast: {
          success: "Account created successfully",
          error: "Error creatting  account",
        },
        login: "Do you already have an account?",
      },
      elements: {
        navbar: {
          portfolio: "Portfolio",
          transactions: "Transactions",
          reports: "Reports",
          search: "Search",
        },
        table: {
          empty: "No data",
          rowPerPage: "Rows per page",
          page: "Page",
        },
      },
      dashboard: {
        total: "Total invested",
        currentValue: "Current Value",
        gain: "Total gain",
        trendingUp: "Trending up this month",
        trendingDown: "Trending down this month",
        graph: {
          title: "Earnings",
          lastMonths: "Last 3 months",
          lastDays: "Last 30 days",
          lastWeek: "Last 7 days",

          totalLastMonths: "Total last 3 months",
          totalLastDays: "Total last 30 days",
          totalLastWeek: "Total last 7 days",
        },
        pie: {
          title: "Portfolios",
        },
      },
      transactions: {
        columns: {
          id: "ID",
          stock: "Stock symbol",
          type: "Type",
          quantity: "Quantity",
          price: "Price",
          fee: "Fee",
          date: "Date",
          note: "Note",
          total: "Total Value",
          edit: {
            fav: "Favorite",
            report: "Report",
          },
        },
        drawer: {
          description: "Prodictions for this stock",
          trend: "Trending up 4.5% this month ",
          info: "Stock will posible go up in the future days.",
        },
        addDrawer: {
          title: "Add transaction",
          description: "In construction",
        },
        actions: {
          customize: "Customize table",
          customizeMobile: "Customize",
          add: "Add transaction",
        },
      },
      reports: {
        columns: {
          id: "ID",
          period: "Period",
          generatedAt: "Generated at",
          portfolio: "Portfolio id",
          status: "Status",

          edit: {
            delete: "Delete",
            download: "Download",
          },
          toast: {
            delete: {
              success: "Successfully deleted",
            },
          },
        },
        status: {
          aging: "Aging",
          outdated: "Outdated",
          current: "Current",
        },
        drawer: {
          id: "Report Id",
          period: "Report period",
          generatedAt: "Generated at",
          summary: "Report summary",
          actions: { download: "Download", view: "View" },
          title: "Report",
          description: "This is the generated report.",
        },
        addDrawer: {
          title: "Generate",
          description: "Generate report",
          period: {
            select: "Select period",
            label: "Period",
            monthly: "Monthly",
            yearly: "Yearly",
          },
          portfolio: {
            select: "Select portfolio",
            label: "Portfolio",
          },
          summary: {
            label: "Summary",
            placeholder: "Add summary",
          },
          toast: {
            success: "Report has been created successfully",
            error: "Failed to create report",
          },
        },
        actions: {
          customize: "Customize table",
          customizeMobile: "Customize",
          generate: "Generate report",
        },
      },
    },
  },
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: "en",
  resources,
  lng: "en",
});

export default i18n;
