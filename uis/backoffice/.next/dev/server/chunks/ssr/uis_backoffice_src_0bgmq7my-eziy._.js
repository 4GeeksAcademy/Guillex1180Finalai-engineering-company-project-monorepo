module.exports = [
"[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IncidentsAnalysisPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/components/Feedback.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$ProtectedPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/components/ProtectedPage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$incidents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/incidents.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const CATEGORIES = [
    'LOST_PARCEL',
    'DELAYED_DELIVERY',
    'WRONG_ADDRESS',
    'RETURN_REQUEST',
    'DAMAGE'
];
const STATUSES = [
    'OPEN',
    'CLOSED',
    'DISCARDED'
];
const SCORES = [
    '1',
    '2',
    '3',
    '4',
    '5'
];
function IncidentsAnalysisPage() {
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [analysis, setAnalysis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [analyzing, setAnalyzing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [downloading, setDownloading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    function acceptFile(candidate) {
        setError('');
        setMessage('');
        if (!candidate) return;
        if (!candidate.name.toLowerCase().endsWith('.csv')) {
            setFile(null);
            setError('Selecciona un archivo con extensión .csv.');
            return;
        }
        setFile(candidate);
        setAnalysis(null);
    }
    function onInputChange(event) {
        acceptFile(event.target.files?.[0]);
    }
    function onDrop(event) {
        event.preventDefault();
        setDragging(false);
        acceptFile(event.dataTransfer.files?.[0]);
    }
    async function runAnalysis() {
        if (!file) {
            setError('Selecciona un archivo CSV antes de analizarlo.');
            return;
        }
        setAnalyzing(true);
        setError('');
        setMessage('');
        try {
            setAnalysis(await __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$incidents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incidentsApi"].analyze(file));
            setMessage('Análisis completado. Los resultados contienen solo métricas agregadas.');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'No se pudo analizar el CSV.');
        } finally{
            setAnalyzing(false);
        }
    }
    async function downloadResults() {
        setDownloading(true);
        setError('');
        try {
            const blob = await __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$incidents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incidentsApi"].downloadResults();
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = 'incidents-results.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(href);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'No se pudo descargar el CSV.');
        } finally{
            setDownloading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$ProtectedPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm font-semibold uppercase tracking-wider text-blue-700",
                        children: "TrackFlow · Customer Experience"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 84,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "mt-1 text-3xl font-bold",
                        children: "Análisis de incidencias"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 85,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 max-w-3xl text-slate-600",
                        children: "Carga el CSV del helpdesk para revisar volumen, calidad de datos y satisfacción. Los correos se usan solo para validación y nunca se muestran ni se exportan."
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 86,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 83,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
                "aria-labelledby": "upload-title",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "upload-title",
                        className: "text-lg font-semibold",
                        children: "Cargar archivo CSV"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 90,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        onDragOver: (event)=>{
                            event.preventDefault();
                            setDragging(true);
                        },
                        onDragLeave: ()=>setDragging(false),
                        onDrop: onDrop,
                        className: `mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${dragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-500'}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold text-slate-800",
                                children: "Arrastra aquí el CSV o selecciónalo"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 97,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "mt-1 text-sm text-slate-500",
                                children: "UTF-8, separado por comas, con encabezados de TrackFlow"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 98,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "sr-only",
                                type: "file",
                                accept: ".csv,text/csv",
                                onChange: onInputChange
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 99,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 91,
                        columnNumber: 7
                    }, this),
                    file && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-3 text-sm text-slate-700",
                        children: [
                            "Archivo seleccionado: ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: file.name
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 101,
                                columnNumber: 81
                            }, this),
                            " (",
                            (file.size / 1024).toFixed(1),
                            " KB)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 101,
                        columnNumber: 16
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: runAnalysis,
                        disabled: !file || analyzing,
                        className: "mt-4 rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400",
                        children: analyzing ? 'Analizando…' : 'Analizar incidencias'
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 102,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 89,
                columnNumber: 5
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    kind: "error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                    lineNumber: 107,
                    columnNumber: 37
                }, this)
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 107,
                columnNumber: 15
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    kind: "success",
                    children: message
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                    lineNumber: 108,
                    columnNumber: 39
                }, this)
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 108,
                columnNumber: 17
            }, this),
            analysis && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-7 space-y-6",
                "aria-live": "polite",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-end justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold",
                                        children: "Resumen del análisis"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 112,
                                        columnNumber: 14
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-slate-600",
                                        children: "Los desgloses se calculan solo sobre los registros válidos."
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 112,
                                        columnNumber: 74
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 112,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: downloadResults,
                                disabled: downloading,
                                className: "rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50",
                                children: downloading ? 'Preparando…' : 'Descargar resultados CSV'
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 113,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 111,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid gap-4 sm:grid-cols-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Metric, {
                                title: "Registros procesados",
                                value: analysis.total_records
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 117,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Metric, {
                                title: "Registros válidos",
                                value: analysis.valid_records,
                                tone: "green"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 118,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Metric, {
                                title: "Inválidos / incompletos",
                                value: analysis.invalid_records,
                                tone: analysis.invalid_records ? 'amber' : 'green'
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 119,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 116,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid gap-6 lg:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Breakdown, {
                                title: "Incidencias por categoría",
                                values: analysis.category_counts,
                                keys: CATEGORIES
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 123,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Breakdown, {
                                title: "Incidencias por estado",
                                values: analysis.status_counts,
                                keys: STATUSES
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 124,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 122,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid gap-6 lg:grid-cols-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-semibold",
                                        children: "Índice de satisfacción"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 129,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-3 text-3xl font-bold text-blue-800",
                                        children: analysis.satisfaction.average_score === null ? 'N/D' : `${analysis.satisfaction.average_score.toFixed(2)} / 5`
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 130,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-slate-600",
                                        children: [
                                            "Puntuaciones registradas en casos cerrados: ",
                                            analysis.satisfaction.scored_closed_count,
                                            " de ",
                                            analysis.satisfaction.closed_count
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 131,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 space-y-2",
                                        children: SCORES.map((score)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between border-t border-slate-100 pt-2 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: [
                                                            "Puntuación ",
                                                            score
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                        lineNumber: 132,
                                                        columnNumber: 155
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: analysis.satisfaction.score_counts[score] ?? 0
                                                    }, void 0, false, {
                                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                        lineNumber: 132,
                                                        columnNumber: 186
                                                    }, this)
                                                ]
                                            }, score, true, {
                                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                lineNumber: 132,
                                                columnNumber: 66
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 132,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 128,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-xl border border-amber-200 bg-amber-50 p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-semibold text-amber-950",
                                        children: "Registros inválidos por motivo"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 135,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-amber-900",
                                        children: "Un registro puede incumplir más de una regla; el total de registros inválidos se cuenta una sola vez."
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "mt-4 space-y-2",
                                        children: analysis.invalid_breakdown.filter((item)=>item.count > 0).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "flex justify-between gap-4 border-t border-amber-200 pt-2 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: item.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 215
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: item.count
                                                    }, void 0, false, {
                                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                        lineNumber: 137,
                                                        columnNumber: 240
                                                    }, this)
                                                ]
                                            }, item.code, true, {
                                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                                lineNumber: 137,
                                                columnNumber: 117
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 137,
                                        columnNumber: 11
                                    }, this),
                                    analysis.invalid_records === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-3 text-sm text-emerald-800",
                                        children: "No se encontraron registros inválidos."
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 138,
                                        columnNumber: 46
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 134,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 127,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 110,
                columnNumber: 18
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
        lineNumber: 82,
        columnNumber: 10
    }, this);
}
function Metric({ title, value, tone = 'blue' }) {
    const tones = {
        blue: 'text-blue-800',
        green: 'text-emerald-800',
        amber: 'text-amber-800'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-slate-600",
                children: title
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 147,
                columnNumber: 85
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `mt-1 text-3xl font-bold ${tones[tone]}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 147,
                columnNumber: 134
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
        lineNumber: 147,
        columnNumber: 10
    }, this);
}
function Breakdown({ title, values, keys }) {
    const total = Object.values(values).reduce((sum, count)=>sum + count, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold",
                children: title
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 152,
                columnNumber: 89
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "mt-3 space-y-2",
                children: keys.map((key)=>{
                    const count = values[key] ?? 0;
                    const percent = total ? (count / total * 100).toFixed(1) : '0.0';
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex justify-between gap-4 border-t border-slate-100 pt-2 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-mono text-slate-700",
                                children: key
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 152,
                                columnNumber: 388
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold",
                                children: [
                                    count,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-normal text-slate-500",
                                        children: [
                                            "(",
                                            percent,
                                            "%)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                        lineNumber: 152,
                                        columnNumber: 483
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                                lineNumber: 152,
                                columnNumber: 443
                            }, this)
                        ]
                    }, key, true, {
                        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                        lineNumber: 152,
                        columnNumber: 296
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
                lineNumber: 152,
                columnNumber: 139
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/src/app/backoffice/incidents/page.tsx",
        lineNumber: 152,
        columnNumber: 10
    }, this);
}
}),
"[project]/uis/backoffice/src/components/Feedback.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Feedback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function Feedback({ kind, children }) {
    const styles = {
        error: 'border-red-200 bg-red-50 text-red-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-900'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        role: kind === 'error' ? 'alert' : 'status',
        className: `rounded-lg border px-4 py-3 text-sm ${styles[kind]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/src/components/Feedback.tsx",
        lineNumber: 7,
        columnNumber: 10
    }, this);
}
}),
"[project]/uis/backoffice/src/components/ProtectedPage.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProtectedPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function ProtectedPage({ children }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])()) {
            router.replace('/login');
            return;
        }
        setReady(true);
    }, [
        router
    ]);
    if (!ready) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 text-sm text-slate-500",
        children: "Verificando sesión…"
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
        lineNumber: 20,
        columnNumber: 22
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "border-b border-slate-200 bg-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/backoffice/inventory/products",
                            className: "mr-auto text-lg font-bold text-slate-900",
                            children: [
                                "TrackFlow ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium text-slate-500",
                                    children: "/ Operaciones"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 26,
                                    columnNumber: 118
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                            lineNumber: 26,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "flex flex-wrap gap-4 text-sm font-medium text-slate-600",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/backoffice/inventory/products",
                                    className: "hover:text-blue-700",
                                    children: "Inventario"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 28,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/backoffice/inventory/orders/inbound",
                                    className: "hover:text-blue-700",
                                    children: "Registrar recepción"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 29,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/backoffice/inventory/orders/outbound",
                                    className: "hover:text-blue-700",
                                    children: "Registrar despacho o pérdida"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 30,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/backoffice/inventory/orders",
                                    className: "hover:text-blue-700",
                                    children: "Movimientos de stock"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 31,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/backoffice/incidents",
                                    className: "hover:text-blue-700",
                                    children: "Análisis de incidencias"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                                    lineNumber: 32,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50",
                            onClick: ()=>{
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSession"])();
                                router.replace('/login');
                            },
                            children: "Cerrar sesión"
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "mx-auto w-full max-w-7xl flex-1 px-5 py-8",
                children: children
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500",
                children: "TrackFlow · Backoffice de inventario"
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TOKEN_KEY",
    ()=>TOKEN_KEY,
    "USER_UUID_KEY",
    ()=>USER_UUID_KEY,
    "clearSession",
    ()=>clearSession,
    "getAccessToken",
    ()=>getAccessToken,
    "getUserUuid",
    ()=>getUserUuid,
    "saveSession",
    ()=>saveSession
]);
'use client';
const TOKEN_KEY = 'trackflow_access_token';
const USER_UUID_KEY = 'trackflow_user_uuid';
function getAccessToken() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
    const token = undefined;
}
function getUserUuid() {
    if ("TURBOPACK compile-time truthy", 1) return '';
    //TURBOPACK unreachable
    ;
}
function saveSession(token, userUuid) {
    // The API client adds the Authorization scheme, so store only the token value.
    window.localStorage.setItem(TOKEN_KEY, token.trim().replace(/^Bearer\s+/i, ''));
    window.localStorage.setItem(USER_UUID_KEY, userUuid.trim());
}
function clearSession() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_UUID_KEY);
}
}),
"[project]/uis/backoffice/src/lib/incidents.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IncidentApiError",
    ()=>IncidentApiError,
    "incidentsApi",
    ()=>incidentsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)");
'use client';
;
const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');
class IncidentApiError extends Error {
    status;
    constructor(status, message){
        super(message), this.status = status;
        this.name = 'IncidentApiError';
    }
}
function errorMessage(data) {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
        const body = data;
        if (typeof body.detail === 'string') return body.detail;
        if (typeof body.message === 'string') return body.message;
        if (typeof body.error === 'string') return body.error;
    }
    return undefined;
}
function authHeaders() {
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])();
    if (!token) throw new IncidentApiError(401, 'No hay una sesión activa. Inicia sesión para continuar.');
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    return headers;
}
const incidentsApi = {
    async analyze (file) {
        const form = new FormData();
        form.append('file', file);
        let response;
        try {
            response = await fetch(`${API_BASE}/api/incidents/analyze`, {
                method: 'POST',
                headers: authHeaders(),
                body: form,
                cache: 'no-store'
            });
        } catch  {
            throw new IncidentApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
        }
        if (!response.ok) {
            let message;
            try {
                message = errorMessage(await response.json());
            } catch  {}
            throw new IncidentApiError(response.status, `Error ${response.status}: ${message || response.statusText}`);
        }
        return response.json();
    },
    async downloadResults () {
        let response;
        try {
            response = await fetch(`${API_BASE}/api/incidents/results/export`, {
                headers: authHeaders(),
                cache: 'no-store'
            });
        } catch  {
            throw new IncidentApiError(0, `No se pudo conectar con la API (${API_BASE}).`);
        }
        if (!response.ok) {
            let message;
            try {
                message = errorMessage(await response.json());
            } catch  {}
            throw new IncidentApiError(response.status, `Error ${response.status}: ${message || response.statusText}`);
        }
        return response.blob();
    }
};
}),
];

//# sourceMappingURL=uis_backoffice_src_0bgmq7my-eziy._.js.map