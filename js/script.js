const CONSTANTS = {
    ELEMENT_IDS: {
        RATE: "rate",
        SUBTOTAL_RATE: "subtotalRate",
        TOTAL_RATE: "totalRate",
        PDF_PREVIEW_FRAME: "pdfPreviewFrame",
        PREVIEW_MODAL: "previewModal",
        INV_NUM: "invNum",
        DATE_ISSUED: "dateIssued",
        COMPANY_NAME: "companyName",
        COMPANY_ADDRESS: "companyAddress",
        COMPANY_PHONE: "companyPhone",
        COMPANY_EMAIL: "companyEmail",
        CLIENT_NAME: "clientName",
        CLIENT_ADDRESS: "clientAddress",
        CLIENT_PHONE: "clientPhone",
        CLIENT_EMAIL: "clientEmail",
        INVOICE_ITEM: "invoiceItem",
        CURRENCY: "currency",
        RATE_LABEL: "rateLabel",
        SUBTOTAL_LABEL: "subtotalLabel",
    },
    FILES: {
        TEMPLATE_JSON: "./templates/salary_template.json",
        TEMPLATE_IMAGE: "./resources/salary_template.png",
        FONT: "./fonts/PPTelegraf-Regular.ttf",
    },
    FONT_NAME: "Telegraf",
    CURRENCY_PLACEHOLDER: "PHP",
};

document.addEventListener("DOMContentLoaded", function () {
    const rateInput = document.getElementById(CONSTANTS.ELEMENT_IDS.RATE);
    const subtotalInput = document.getElementById(CONSTANTS.ELEMENT_IDS.SUBTOTAL_RATE);
    const totalRate = document.getElementById(CONSTANTS.ELEMENT_IDS.TOTAL_RATE);

    function formatNumberWithCommas(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function unformatNumber(value) {
        return value.replace(/,/g, "");
    }

    function updateTotals() {
        const rate = parseFloat(unformatNumber(rateInput.value)) || 0;
        subtotalInput.value = rateInput.value || 0;
        totalRate.innerText = formatNumberWithCommas(rate.toFixed(2));
    }

    rateInput.addEventListener("input", updateTotals);

    var elems = document.querySelectorAll("select");
    M.FormSelect.init(elems);

    window.onload = updateTotals;
});

async function showPreview() {
    const doc = await createInvoicePDF();

    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    const iframe = document.getElementById(CONSTANTS.ELEMENT_IDS.PDF_PREVIEW_FRAME);
    iframe.src = blobUrl;

    const modal = M.Modal.getInstance(document.getElementById(CONSTANTS.ELEMENT_IDS.PREVIEW_MODAL));
    modal.open();
}

async function generatePDF() {
    const doc = await createInvoicePDF();
    const inputs = getInputValues();
    doc.save(`Invoice-${inputs.invNum}.pdf`);
}

async function createInvoicePDF(
    templateFile = CONSTANTS.FILES.TEMPLATE_JSON,
    templateImageFile = CONSTANTS.FILES.TEMPLATE_IMAGE
) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "px", [595, 842]);

    const templateConfig = await fetchTemplateConfig(templateFile);
    await addTemplateImage(doc, templateImageFile);
    await loadCustomFont(doc);

    const inputs = getInputValues();
    doc.setFontSize(17);
    for (const field of templateConfig.fields) {
        let value = inputs[field.key] || "";

        if ((field.key === "companyAddress" || field.key === "clientAddress") && field.wrapWidth) {
            value = doc.splitTextToSize(value, field.wrapWidth);
        }

        if (
            field.key === CONSTANTS.ELEMENT_IDS.RATE ||
            field.key === CONSTANTS.ELEMENT_IDS.SUBTOTAL_RATE ||
            field.key === CONSTANTS.ELEMENT_IDS.TOTAL_RATE
        ) {
            value += ` ${CONSTANTS.CURRENCY_PLACEHOLDER}`;
        }

        doc.text(value, field.x, field.y, { align: field.align || "left" });
    }

    return doc;
}

async function fetchTemplateConfig(url) {
    const response = await fetch(url);
    return response.json();
}

async function loadCustomFont(doc) {
    const fontData = await fetchFontAsBase64(CONSTANTS.FILES.FONT);
    doc.addFileToVFS(CONSTANTS.FILES.FONT, fontData);
    doc.addFont(CONSTANTS.FILES.FONT, CONSTANTS.FONT_NAME, "normal");
    doc.setFont(CONSTANTS.FONT_NAME);
}

async function addTemplateImage(doc, templateImageFile) {
    const templateImage = await loadImageAsBase64(templateImageFile);
    doc.addImage(templateImage, "PNG", 0, 0, 595, 842);
}

function getInputValues() {
    const getValue = (id) => document.getElementById(id).value;

    return {
        invNum: getValue(CONSTANTS.ELEMENT_IDS.INV_NUM),
        dateIssued: getValue(CONSTANTS.ELEMENT_IDS.DATE_ISSUED),
        companyName: getValue(CONSTANTS.ELEMENT_IDS.COMPANY_NAME),
        companyAddress: getValue(CONSTANTS.ELEMENT_IDS.COMPANY_ADDRESS),
        companyPhone: getValue(CONSTANTS.ELEMENT_IDS.COMPANY_PHONE),
        companyEmail: getValue(CONSTANTS.ELEMENT_IDS.COMPANY_EMAIL),
        clientName: getValue(CONSTANTS.ELEMENT_IDS.CLIENT_NAME),
        clientAddress: getValue(CONSTANTS.ELEMENT_IDS.CLIENT_ADDRESS),
        clientPhone: getValue(CONSTANTS.ELEMENT_IDS.CLIENT_PHONE),
        clientEmail: getValue(CONSTANTS.ELEMENT_IDS.CLIENT_EMAIL),
        invoiceItem: getValue(CONSTANTS.ELEMENT_IDS.INVOICE_ITEM),
        rate: getValue(CONSTANTS.ELEMENT_IDS.RATE),
        subtotalRate: getValue(CONSTANTS.ELEMENT_IDS.RATE),
        totalRate: getValue(CONSTANTS.ELEMENT_IDS.RATE),
    };
}

async function fetchFontAsBase64(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(arrayBuffer);
}

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function loadImageAsBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.replace(/^data:image\/png;base64,/, ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function updateCurrencyLabels() {
    const currency = document.getElementById(CONSTANTS.ELEMENT_IDS.CURRENCY).value;
    document.getElementById(CONSTANTS.ELEMENT_IDS.RATE_LABEL).innerText = `Rate (${currency})`;
    document.getElementById(CONSTANTS.ELEMENT_IDS.SUBTOTAL_LABEL).innerText = `Subtotal (${currency})`;
}
