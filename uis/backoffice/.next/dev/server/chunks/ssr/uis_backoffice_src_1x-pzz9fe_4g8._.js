module.exports = [
"[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OutboundPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
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
function OutboundPage() {
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [skuId, setSkuId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [quantity, setQuantity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [exitType, setExitType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('dispatch');
    const [tracking, setTracking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loadingProducts, setLoadingProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["inventoryApi"].listSKUs().then((items)=>{
            setProducts(items);
            const requestedId = new URLSearchParams(window.location.search).get('sku_id');
            if (requestedId && items.some((item)=>item.id === Number(requestedId))) setSkuId(requestedId);
        }).catch((reason)=>setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los SKU.')).finally(()=>setLoadingProducts(false));
    }, []);
    const selected = products.find((item)=>item.id === Number(skuId));
    const requestedQuantity = Number(quantity);
    const insufficient = Boolean(selected && requestedQuantity > 0 && requestedQuantity > selected.current_stock);
    const trackingRequired = exitType === 'dispatch';
    async function submit(event) {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (!selected) {
            setError('Selecciona un SKU válido.');
            return;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserUuid"])()) {
            setError('Falta el UUID del coordinador logístico que autoriza la salida. Cierra sesión y configúralo de nuevo.');
            return;
        }
        if (requestedQuantity <= 0 || !Number.isInteger(requestedQuantity)) {
            setError('La cantidad debe ser un número entero mayor que cero.');
            return;
        }
        if (insufficient) {
            setError(`Stock insuficiente: disponible ${selected.current_stock}, solicitado ${requestedQuantity}.`);
            return;
        }
        if (trackingRequired && !tracking.trim()) {
            setError('El número de seguimiento es obligatorio para un despacho.');
            return;
        }
        setBusy(true);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["inventoryApi"].createOutbound({
                sku_id: selected.id,
                quantity: requestedQuantity,
                exit_type: exitType,
                tracking_number: trackingRequired ? tracking.trim() : null,
                warehouse: selected.warehouse,
                user_uuid: (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUserUuid"])()
            });
            setSuccess('Salida de stock registrada correctamente.');
            setQuantity('');
            setTracking('');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'No se pudo registrar la salida de stock.');
        } finally{
            setBusy(false);
        }
        // A refresh failure must not report a failed StockExit after the POST succeeded.
        try {
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$lib$2f$inventory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["inventoryApi"].listSKUs();
            setProducts(updated);
        } catch  {
        // Keep the successful confirmation; the operator can reload to refresh stock.
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$ProtectedPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-semibold uppercase tracking-wider text-blue-700",
                    children: "StockExit · despacho o pérdida confirmada"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                    lineNumber: 57,
                    columnNumber: 52
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mt-1 text-3xl font-bold",
                    children: "Registrar salida de stock"
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                    lineNumber: 57,
                    columnNumber: 173
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-slate-600",
                    children: "Consulta el stock actual del almacén antes de registrar un despacho a cliente o una pérdida confirmada."
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                    lineNumber: 57,
                    columnNumber: 243
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
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                            lineNumber: 59,
                                            columnNumber: 231
                                        }, this),
                                        products.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: item.id,
                                                children: [
                                                    item.name,
                                                    " · ",
                                                    item.sku,
                                                    " · stock ",
                                                    item.current_stock,
                                                    " · ",
                                                    item.warehouse
                                                ]
                                            }, item.id, true, {
                                                fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                                lineNumber: 59,
                                                columnNumber: 337
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                    lineNumber: 59,
                                    columnNumber: 69
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 59,
                            columnNumber: 7
                        }, this),
                        selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-lg bg-slate-100 px-4 py-3 text-sm",
                            children: [
                                "Stock actual en ",
                                selected.warehouse,
                                ": ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: [
                                        selected.current_stock,
                                        " unidades"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                    lineNumber: 60,
                                    columnNumber: 117
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 60,
                            columnNumber: 20
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Unidades a despachar o dar de baja",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    min: "1",
                                    type: "number",
                                    value: quantity,
                                    onChange: (event)=>setQuantity(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                    lineNumber: 61,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 61,
                            columnNumber: 7
                        }, this),
                        insufficient && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "warning",
                            children: [
                                "La cantidad supera el stock actual (",
                                selected?.current_stock,
                                " unidades). Reduce la cantidad para continuar."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 62,
                            columnNumber: 24
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Tipo de salida",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: exitType,
                                    onChange: (event)=>setExitType(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "dispatch",
                                            children: "Despacho a cliente"
                                        }, void 0, false, {
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                            lineNumber: 63,
                                            columnNumber: 237
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "loss",
                                            children: "Pérdida confirmada"
                                        }, void 0, false, {
                                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                            lineNumber: 63,
                                            columnNumber: 289
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                    lineNumber: 63,
                                    columnNumber: 66
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 63,
                            columnNumber: 7
                        }, this),
                        trackingRequired && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm font-medium",
                            children: [
                                "Número de seguimiento del transportista",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    value: tracking,
                                    onChange: (event)=>setTracking(event.target.value),
                                    className: "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5",
                                    placeholder: "1Z999AA10123456784"
                                }, void 0, false, {
                                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                                    lineNumber: 64,
                                    columnNumber: 112
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 64,
                            columnNumber: 28
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "error",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 65,
                            columnNumber: 17
                        }, this),
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$src$2f$components$2f$Feedback$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            kind: "success",
                            children: success
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 65,
                            columnNumber: 71
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            disabled: busy || loadingProducts || !selected || insufficient,
                            className: "rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50",
                            children: busy ? 'Guardando…' : loadingProducts ? 'Cargando SKU…' : 'Registrar salida de stock'
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                            lineNumber: 66,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
                    lineNumber: 58,
                    columnNumber: 5
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
            lineNumber: 57,
            columnNumber: 25
        }, this)
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/src/app/backoffice/inventory/orders/outbound/page.tsx",
        lineNumber: 57,
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
const API_BASE = (process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '/trackflow-api').replace(/\/$/, '');
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

//# sourceMappingURL=uis_backoffice_src_1x-pzz9fe_4g8._.js.map