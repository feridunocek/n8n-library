import { AppWindow, Database, FileSpreadsheet, Globe, MessageSquare, ShoppingBag, Slack, Zap, type LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
    FileSpreadsheet,
    Globe,
    Database,
    Slack,
    Zap,
    ShoppingBag,
    MessageSquare,
    AppWindow
};

export interface Workflow {
    id: string;
    title: string;
    description: string;
    tags: string[];
    serviceNames: string[];
    color: string;
    details?: {
        summary: string;
        nodeCount: number;
        trigger: string;
        useCases: string[];
        processSteps: string[];
        technicalFeatures: string[];
        jsonContent: string;
    };
}

const SAMPLE_JSON = `{
  "name": "Example Workflow",
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {}
}`;

export const workflows: Workflow[] = [
    {
        id: "1",
        title: "Lead Enrichment Pipeline",
        description: "Automates lead data from forms, enriches with Clearbit, and updates CRM.",
        tags: ["marketing", "sales", "automation"],
        serviceNames: ["FileSpreadsheet", "Globe", "Database"],
        color: "from-green-500/20 to-emerald-500/5",
        details: {
            summary: "This workflow listens for new rows in Google Sheets, fetches additional company data using Clearbit API, and inserts the enriched lead into PostgreSQL CRM.",
            nodeCount: 12,
            trigger: "Google Sheets Trigger",
            useCases: ["Sales Lead Qualification", "Marketing Data Enrichment", "CRM Sync"],
            processSteps: [
                "Google Sheets'e yeni bir satır eklendiğinde tetiklenir.",
                "Eklenen e-posta adresi Clearbit API'sine gönderilir ve şirket verileri zenginleştirilir.",
                "Eğer şirket verisi bulunursa, veriler standart formata dönüştürülür.",
                "Zenginleştirilmiş veriler PostgreSQL veritabanındaki 'leads' tablosuna yazılır.",
                "Satış ekibine Slack üzerinden bildirim gönderilir."
            ],
            technicalFeatures: [
                "Google Sheets API entegrasyonu.",
                "Clearbit ile gerçek zamanlı veri zenginleştirme.",
                "PostgreSQL veritabanı yazma işlemleri.",
                "Hata yönetimi ve Slack bildirimleri."
            ],
            jsonContent: SAMPLE_JSON
        }
    },
    {
        id: "2",
        title: "Slack Notification Bot",
        description: "Sends real-time alerts to Slack channels for critical system events.",
        tags: ["devops", "slack", "alerts"],
        serviceNames: ["Slack", "Zap"],
        color: "from-purple-500/20 to-indigo-500/5",
        details: {
            summary: "Monitors system events via Webhook, filters for critical errors, and posts formatted messages including error stack traces to a dedicated Slack channel.",
            nodeCount: 5,
            trigger: "Webhook (POST)",
            useCases: ["Server Monitoring", "Error Reporting", "Team Notifications"],
            processSteps: [
                "Webhook üzerinden bir 'error' eventi alındığında başlar.",
                "Gelen JSON payload'ı pars edilir ve kritiklik seviyesi kontrol edilir.",
                "Eğer seviye 'Critical' ise, hata mesajı formatlanır.",
                "Slack blok kiti kullanılarak kanala görsel bir kart gönderilir."
            ],
            technicalFeatures: [
                "Webhook tabanlı anlık tetikleme.",
                "JSON veri parsing ve filtreleme.",
                "Slack Block Kit ile zengin mesaj formatı."
            ],
            jsonContent: SAMPLE_JSON
        }
    },
    {
        id: "3",
        title: "E-commerce Order Sync",
        description: "Syncs new Shopify orders to Airtable for fulfillment tracking.",
        tags: ["sales", "operations", "shopify"],
        serviceNames: ["ShoppingBag", "Database", "MessageSquare"],
        color: "from-orange-500/20 to-red-500/5",
        details: {
            summary: "Triggers on new Shopify orders, formats order items, calculates total weight, and creates a new record in Airtable for the logistics team.",
            nodeCount: 8,
            trigger: "Shopify Trigger",
            useCases: ["Order Fulfillment", "Inventory Tracking", "Logistics Coordination"],
            processSteps: [
                "Shopify'da yeni sipariş oluştuğunda tetiklenir.",
                "Sipariş kalemleri döngüye alınarak tek tek işlenir.",
                "Her ürün için stok durumu kontrol edilir.",
                "Sipariş detayları Airtable 'Siparişler' tablosuna eklenir.",
                "Lojistik ekibine e-posta ile bildirim geçilir."
            ],
            technicalFeatures: [
                "Shopify Webhook entegrasyonu.",
                "Array iterasyonu ve veri manipülasyonu.",
                "Airtable API ile kayıt oluşturma."
            ],
            jsonContent: SAMPLE_JSON
        }
    },
    {
        id: "4",
        title: "Daily Metric Report",
        description: "Generates and emails a daily PDF report of key business metrics.",
        tags: ["hr", "reporting", "analytics"],
        serviceNames: ["AppWindow", "FileSpreadsheet"],
        color: "from-blue-500/20 to-cyan-500/5",
        details: {
            summary: "Runs every morning at 8 AM, queries database for daily stats, generates a PDF using HTML template, and emails it to the management team.",
            nodeCount: 15,
            trigger: "Cron (Every Day at 8:00 AM)",
            useCases: ["Executive Reporting", "Daily Standup Stats", "Performance Tracking"],
            processSteps: [
                "Her sabah saat 08:00'de Cron job ile başlar.",
                "Veritabanından dünün satış verileri sorgulanır.",
                "Veriler HTML şablonuna gömülür ve PDF'e dönüştürülür.",
                "Oluşturulan PDF, belirlenen e-posta listesine gönderilir."
            ],
            technicalFeatures: [
                "Zamanlanmış görevler (Cron).",
                "SQL sorgulama ve veri agregasyonu.",
                "HTML to PDF dönüşümü.",
                "SMTP üzerinden e-posta gönderimi."
            ],
            jsonContent: SAMPLE_JSON
        }
    }
];
