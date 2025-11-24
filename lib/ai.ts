import { GoogleGenAI } from "@google/genai";
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Interfaces for Data needed by AI
interface TransactionData {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
}

interface BudgetData {
  category: string;
  limit: number;
}

interface GoalData {
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface FinancialReport {
  id?: string;
  timestamp: number;
  resume: string;
  surveiller: string[];
  problematiques: string[];
  opportunites: string[];
  projection: string;
  budgets: any;
  objectifs: any;
  conseils: string[];
  score: number;
}

// Direct static access for Vite
const getApiKey = () => {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY;
};

export const aiService = {
  
  /**
   * Main function to trigger analysis
   */
  analyzeUser: async (userId: string, dataContext: any, settings: any): Promise<FinancialReport> => {
    
    // 1. SECURITY & CONSENT CHECK
    if (!settings || settings.ai_financial_consent !== true) {
       throw new Error("CONSENT_REQUIRED: L'utilisateur n'a pas donné son consentement pour l'IA.");
    }

    if (!userId) throw new Error("User ID required");

    // 2. DATA GATHERING & PSEUDONYMIZATION
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const transactions: TransactionData[] = dataContext.transactions
        .filter((t: any) => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .map((t: any) => ({
            amount: t.amount,
            type: t.type,
            category: t.category, 
            date: new Date(t.date).toISOString().split('T')[0]
        }));

    const budgets: BudgetData[] = dataContext.budgets.map((b: any) => ({
        category: b.category,
        limit: b.limit
    }));

    const goals: GoalData[] = dataContext.savingsGoals.map((g: any) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount
    }));

    const payload = {
        month: `${currentMonth + 1}/${currentYear}`,
        transactions,
        budgets,
        goals
    };

    // 3. CALL GEMINI
    const report = await callGeminiAgent(payload);

    // 4. SAVE REPORT TO FIRESTORE
    const reportId = Date.now().toString();
    const reportRef = doc(db, 'users', userId, 'financial_reports', reportId);
    
    const savedReport = { ...report, timestamp: Date.now() };
    await setDoc(reportRef, savedReport);

    return savedReport;
  },

  /**
   * Fetch analysis history
   */
  getHistory: async (userId: string): Promise<FinancialReport[]> => {
      try {
        const historyRef = collection(db, 'users', userId, 'financial_reports');
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinancialReport));
      } catch (e) {
          console.warn("Could not fetch history", e);
          return [];
      }
  }
};

/**
 * Internal function to call Google GenAI
 */
async function callGeminiAgent(data: any): Promise<FinancialReport> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Clé API Gemini manquante (VITE_GEMINI_API_KEY).");

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
=== PROMPT AGENT FINANCIER ===
Tu es un coach financier personnel.
Voici les données complètes de l’utilisateur sous forme de JSON.

Analyse-les et renvoie un rapport en sections :

Résumé clair
Points à surveiller
Dépenses problématiques
Opportunités d'amélioration
Projection de fin de mois
Évaluation du respect des budgets par catégorie
Progression de l’épargne / objectifs
Conseils personnalisés
Indice de stabilité financière (0–100)

Renvoie exclusivement un JSON valide (sans markdown) avec cette structure exacte :
{
"resume": "...",
"surveiller": ["..."],
"problematiques": ["..."],
"opportunites": ["..."],
"projection": "...",
"budgets": {"Category": "Status"},
"objectifs": {"Goal": "Status"},
"conseils": ["..."],
"score": 87
}

Voici les données utilisateur :
${JSON.stringify(data)}
=== FIN PROMPT ===
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");

        return JSON.parse(text) as FinancialReport;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Impossible de générer le rapport pour le moment.");
    }
}