module.exports = [
"[project]/uis/backoffice/src/app/login/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/components/Feedback.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function LoginPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [token, setToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [userUuid, setUserUuid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    function submit(event) {
        event.preventDefault();
        if (!token.trim()) {
            setError('Introduce el token de acceso emitido por el sistema de autenticación de TrackFlow.');
            return;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveSession"])(token, userUuid);
        router.replace('/backoffice/inventory/products');
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "grid min-h-screen place-items-center px-5 py-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-semibold uppercase tracking-wider text-blue-700",
                    children: "TrackFlow · Operaciones"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mt-2 text-2xl font-bold",
                    children: "Acceso al backoffice"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-sm leading-6 text-slate-600",
                    children: "Pega el bearer token de tu sesión autenticada. No se almacenan credenciales en este formulario."
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    className: "mt-6 space-y-4",
                    onSubmit: submit,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Token de acceso",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    autoComplete: "off",
                                    required: true,
                                    rows: 4,
                                    value: token,
                                    onChange: (event)=>setToken(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100",
                                    placeholder: "Bearer token"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                                    lineNumber: 32,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "UUID de usuario (TinyDB)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    value: userUuid,
                                    onChange: (event)=>setUserUuid(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100",
                                    placeholder: "UUID del operario"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                                    lineNumber: 35,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "error",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                            lineNumber: 37,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800",
                            children: "Continuar"
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-5 text-xs leading-5 text-slate-500",
                    children: "La API debe estar configurada y en ejecución. Este formulario no sustituye un proveedor de autenticación ni valida el token localmente."
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/src/app/login/page.tsx",
        lineNumber: 25,
        columnNumber: 5
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
];

//# sourceMappingURL=uis_backoffice_src_0qmt_kxxirtke._.js.map