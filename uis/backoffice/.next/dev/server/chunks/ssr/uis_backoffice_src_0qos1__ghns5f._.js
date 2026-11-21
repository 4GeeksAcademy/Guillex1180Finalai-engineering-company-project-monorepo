module.exports = [
"[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>InboundPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/components/Feedback.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$ProtectedPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/components/ProtectedPage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/inventory.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function InboundPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [skuId, setSkuId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [quantity, setQuantity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [reference, setReference] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [warehouse, setWarehouse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('LA');
    const [loadingProducts, setLoadingProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["inventoryApi"].listSKUs().then((items)=>{
            setProducts(items);
            const requestedId = new URLSearchParams(window.location.search).get('sku_id');
            if (requestedId && items.some((item)=>item.id === Number(requestedId))) setSkuId(requestedId);
        }).catch((reason)=>setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKUs.')).finally(()=>setLoadingProducts(false));
    }, []);
    const selected = products.find((item)=>item.id === Number(skuId));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (selected) setWarehouse(selected.warehouse);
    }, [
        selected
    ]);
    async function submit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (!selected) {
            setError('Selecciona un SKU válido.');
            return;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserUuid"])()) {
            setError('Falta el UUID del operario de almacén. Cierra sesión y configúralo de nuevo.');
            return;
        }
        setBusy(true);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["inventoryApi"].createInbound({
                sku_id: selected.id,
                quantity: Number(quantity),
                reference: reference.trim(),
                warehouse,
                user_uuid: (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserUuid"])()
            });
            setSuccess('Recepción de mercancía registrada correctamente.');
            setSkuId('');
            setQuantity('');
            setReference('');
            setWarehouse('LA');
            router.refresh();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'No se pudo registrar la entrada.');
        } finally{
            setBusy(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$ProtectedPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-semibold uppercase tracking-wider text-blue-700",
                    children: "StockEntry · recepción"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                    lineNumber: 48,
                    columnNumber: 52
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mt-1 text-3xl font-bold",
                    children: "Registrar recepción de mercancía"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                    lineNumber: 48,
                    columnNumber: 154
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-slate-600",
                    children: "Registra las unidades recibidas de una marca cliente en el almacén de TrackFlow."
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                    lineNumber: 48,
                    columnNumber: 231
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: submit,
                    className: "mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "SKU / descripción",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    required: true,
                                    value: skuId,
                                    onChange: (event)=>setSkuId(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: loadingProducts ? 'Cargando SKU…' : 'Seleccionar SKU…'
                                        }, void 0, false, {
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                            lineNumber: 50,
                                            columnNumber: 231
                                        }, this),
                                        products.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: item.id,
                                                children: [
                                                    item.name,
                                                    " · ",
                                                    item.sku,
                                                    " · ",
                                                    item.warehouse
                                                ]
                                            }, item.id, true, {
                                                fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                                lineNumber: 50,
                                                columnNumber: 337
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                    lineNumber: 50,
                                    columnNumber: 69
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 50,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Unidades recibidas",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    min: "1",
                                    type: "number",
                                    value: quantity,
                                    onChange: (event)=>setQuantity(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                    lineNumber: 51,
                                    columnNumber: 70
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 51,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Referencia de despacho del cliente",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    value: reference,
                                    onChange: (event)=>setReference(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5",
                                    placeholder: "PO-2024-0098"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                    lineNumber: 52,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 52,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Almacén receptor",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: warehouse,
                                    onChange: (event)=>setWarehouse(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "LA",
                                            children: "LA — Los Ángeles"
                                        }, void 0, false, {
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                            lineNumber: 53,
                                            columnNumber: 242
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "ZGZ",
                                            children: "ZGZ — Zaragoza"
                                        }, void 0, false, {
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                            lineNumber: 53,
                                            columnNumber: 286
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                                    lineNumber: 53,
                                    columnNumber: 68
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 53,
                            columnNumber: 7
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "error",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 54,
                            columnNumber: 17
                        }, this),
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "success",
                            children: success
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 54,
                            columnNumber: 71
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            disabled: busy || loadingProducts || products.length === 0,
                            className: "rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50",
                            children: busy ? 'Guardando…' : loadingProducts ? 'Cargando SKU…' : 'Confirmar recepción'
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                            lineNumber: 55,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
                    lineNumber: 49,
                    columnNumber: 5
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
            lineNumber: 48,
            columnNumber: 25
        }, this)
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/inbound/page.tsx",
        lineNumber: 48,
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
                            lineNumber: 33,
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
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500",
                children: "TrackFlow · Backoffice de inventario"
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/src/components/ProtectedPage.tsx",
                lineNumber: 37,
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
"[project]/uis/backoffice/src/lib/inventory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InventoryApiError",
    ()=>InventoryApiError,
    "inventoryApi",
    ()=>inventoryApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/src/lib/auth.ts [app-ssr] (ecmascript)");
;
// Route requests through the same-origin Next.js server. This avoids browser
// access to the private API port URL in Codespaces and keeps CORS out of the path.
const API_BASE = (("TURBOPACK compile-time value", "/trackflow-api") ?? '/trackflow-api').replace(/\/$/, '');
class InventoryApiError extends Error {
    status;
    constructor(status, message){
        super(message), this.status = status;
        this.name = 'InventoryApiError';
    }
}
function readableError(value) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        const messages = value.map((item)=>{
            if (!item || typeof item !== 'object') return readableError(item);
            const error = item;
            const message = readableError(error.msg ?? error.message);
            return message ? `${Array.isArray(error.loc) ? `${error.loc.slice(1).join('.')}: ` : ''}${message}` : undefined;
        }).filter((item)=>Boolean(item));
        return messages.length ? messages.join('; ') : undefined;
    }
    if (value && typeof value === 'object') {
        const body = value;
        const direct = readableError(body.detail ?? body.message ?? body.error ?? body.msg);
        if (direct) return direct;
    }
    return undefined;
}
async function request(path, init = {}) {
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])();
    if (!token) throw new InventoryApiError(401, 'No hay una sesión activa. Inicia sesión para continuar.');
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers,
            cache: 'no-store'
        });
    } catch  {
        throw new InventoryApiError(0, `No se pudo conectar con la API (${API_BASE}). Comprueba que el backend esté ejecutándose.`);
    }
    if (!response.ok) {
        const raw = await response.text().catch(()=>'');
        let message;
        try {
            const body = JSON.parse(raw);
            if (body && typeof body === 'object') {
                message = readableError(body);
            }
        } catch  {
            message = raw.trim() || undefined;
        }
        throw new InventoryApiError(response.status, `Error ${response.status}: ${message || response.statusText || 'No se recibió un mensaje de error.'}`);
    }
    if (response.status === 204) return undefined;
    return response.json();
}
const inventoryApi = {
    listSKUs: async ()=>{
        const result = await request('/inventory/products');
        return Array.isArray(result) ? result : result.products;
    },
    getSKU: (id)=>request(`/inventory/products/${id}`),
    createSKU: (data)=>request('/inventory/products', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    createInbound: (data)=>request('/inventory/orders/inbound', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    createOutbound: (data)=>request('/inventory/orders/outbound', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    listOrders: async ()=>{
        const result = await request('/inventory/orders');
        return Array.isArray(result) ? result : result.orders;
    }
};
}),
];

//# sourceMappingURL=uis_backoffice_src_0qos1__ghns5f._.js.map