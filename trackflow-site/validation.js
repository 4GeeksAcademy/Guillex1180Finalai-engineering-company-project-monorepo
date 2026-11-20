/**
 * validation.js — Validación completa del formulario de TrackFlow (application.html)
 *
 * Funcionalidades:
 * - Validación en tiempo real (blur / input / change)
 * - Accesibilidad WCAG: aria-invalid, aria-describedby, role="alert"
 * - Feedback visual: border-red-500 (error) / border-green-500 (válido)
 * - Contador de comentarios en tiempo real (máx 500)
 * - Advertencia de volumen bajo (0–100)
 * - Animación shake en errores al hacer submit
 * - Enfoque automático en el primer error
 * - Mensaje de éxito con resumen de datos enviados
 *
 * ES6+ — Sin dependencias externas.
 */

'use strict';

(() => {
  // ================================================================
  // CONFIGURACIÓN
  // ================================================================

  const CONFIG = Object.freeze({
    formId: 'application-form',
    successId: 'success-message',
    warningId: 'volumen-warning',
    counterId: 'comentarios-count',
    maxComentarios: 500,
    warningThreshold: 450,

    /* Mapeo fieldId → { errorId, validator, isGroup, groupName } */
    fields: [
      { fieldId: 'empresa',       errorId: 'empresa-error',       validator: v => v.trim().length >= 2 },
      { fieldId: 'contacto',      errorId: 'contacto-error',      validator: v => v.trim().split(/\s+/).length >= 2 },
      { fieldId: 'email',         errorId: 'email-error',         validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
      { fieldId: 'telefono',      errorId: 'telefono-error',      validator: v => /^\+\d[\d\s\-]{4,20}$/.test(v.trim()) },
      { fieldId: 'sitio-web',    errorId: 'sitio-web-error',    validator: v => !v.trim() || /^https?:\/\/.+/.test(v.trim()) },
      { fieldId: 'pais',          errorId: 'pais-error',          validator: v => v.trim().length > 0 },
      { fieldId: 'tipo-producto', errorId: 'tipo-producto-error', validator: v => v.trim().length > 0 },
      { fieldId: 'volumen',       errorId: 'volumen-error',       validator: v => v.trim().length > 0 },
    ],
  });

  // ================================================================
  // UTILIDADES
  // ================================================================

  /** Marca un campo como inválido: muestra error, clases visuales y atributos aria. */
  const markInvalid = (fieldId, errorId) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (!field || !error) return;

    // Clases visuales (input-error definido en CSS inline)
    field.classList.remove('input-valid');
    field.classList.add('input-error');

    // Atributos ARIA
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);

    // Mostrar error con role="alert" y aria-live
    error.classList.remove('hidden');
    error.classList.add('visible');
    error.setAttribute('aria-live', 'assertive');
    error.setAttribute('role', 'alert');
  };

  /** Marca un campo como válido: oculta error, restaura borde, limpia aria. */
  const markValid = (fieldId, errorId) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (!field || !error) return;

    // Clases visuales (input-valid definido en CSS inline)
    field.classList.remove('input-error');
    field.classList.add('input-valid');

    // ARIA
    field.setAttribute('aria-invalid', 'false');
    field.removeAttribute('aria-describedby');

    // Ocultar error
    error.classList.add('hidden');
    error.classList.remove('visible');
    error.removeAttribute('aria-live');
    error.removeAttribute('role');
  };

  /** Limpia el estado visual de un campo (vuelve a borde neutro). */
  const resetFieldStyle = (fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('input-error', 'input-valid');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  };

  /** Limpia TODOS los errores y estados visuales del formulario. */
  const clearAll = () => {
    document.querySelectorAll('.field-error, #volumen-warning').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('visible');
      el.removeAttribute('aria-live');
      el.removeAttribute('role');
    });
    // Resetear todos los campos del formulario
    CONFIG.fields.forEach(({ fieldId }) => resetFieldStyle(fieldId));
    // Resetear grupos y privacidad
    ['servicios-error', '3pl-error', 'privacidad-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('visible'); el.removeAttribute('aria-live'); el.removeAttribute('role'); }
    });
    document.querySelectorAll('input[name="servicios"],input[name="3pl"],#privacidad').forEach(el => {
      el.removeAttribute('aria-invalid');
    });
  };

  /** Comprueba si al menos un checkbox de un grupo name está marcado. */
  const isAnyChecked = name =>
    [...document.querySelectorAll(`input[name="${name}"]`)].some(cb => cb.checked);

  /** Comprueba si un grupo de radios tiene selección. */
  const isRadioSelected = name =>
    [...document.querySelectorAll(`input[name="${name}"]`)].some(r => r.checked);

  // ================================================================
  // CONTADOR DE COMENTARIOS (tiempo real)
  // ================================================================

  const setupComentariosCounter = () => {
    const ta = document.getElementById('comentarios');
    const ct = document.getElementById(CONFIG.counterId);
    if (!ta || !ct) return;

    const update = () => {
      const len = ta.value.length;
      ct.textContent = len;
      if (len >= CONFIG.warningThreshold) {
        ct.classList.add('text-amber-600');
        ct.classList.remove('text-gray-400');
      } else {
        ct.classList.remove('text-amber-600');
        ct.classList.add('text-gray-400');
      }
    };

    ta.addEventListener('input', update);
    update(); // valor inicial
  };

  // ================================================================
  // ADVERTENCIA DE VOLUMEN BAJO (0–100)
  // ================================================================

  const setupVolumenWarning = () => {
    const sel = document.getElementById('volumen');
    const warn = document.getElementById(CONFIG.warningId);
    if (!sel || !warn) return;

    const toggle = () => {
      if (sel.value === '0-100') {
        warn.classList.remove('hidden');
        warn.classList.add('visible');
      } else {
        warn.classList.add('hidden');
        warn.classList.remove('visible');
      }
    };

    sel.addEventListener('change', toggle);
    toggle(); // estado inicial
  };

  // ================================================================
  // VALIDACIÓN PRINCIPAL (retorna true si todo es válido)
  // ================================================================

  const validateForm = () => {
    clearAll();
    let valid = true;

    // Campos simples
    CONFIG.fields.forEach(({ fieldId, errorId, validator }) => {
      const field = document.getElementById(fieldId);
      if (!field) return;
      // Si el campo está vacío y es un select, validar; si es texto vacío obligatorio, validar
      if (!field.value || !validator(field.value)) {
        markInvalid(fieldId, errorId);
        valid = false;
      } else {
        markValid(fieldId, errorId);
      }
    });

    // 9. Servicios de interés (checkbox group)
    if (!isAnyChecked('servicios')) {
      const err = document.getElementById('servicios-error');
      if (err) {
        err.classList.remove('hidden');
        err.classList.add('visible');
        err.setAttribute('aria-live', 'assertive');
        err.setAttribute('role', 'alert');
      }
      document.querySelectorAll('input[name="servicios"]').forEach(el => el.setAttribute('aria-invalid', 'true'));
      valid = false;
    } else {
      document.querySelectorAll('input[name="servicios"]').forEach(el => el.setAttribute('aria-invalid', 'false'));
    }

    // 10. 3PL actual (radio group)
    if (!isRadioSelected('3pl')) {
      const err = document.getElementById('3pl-error');
      if (err) {
        err.classList.remove('hidden');
        err.classList.add('visible');
        err.setAttribute('aria-live', 'assertive');
        err.setAttribute('role', 'alert');
      }
      document.querySelectorAll('input[name="3pl"]').forEach(el => el.setAttribute('aria-invalid', 'true'));
      valid = false;
    } else {
      document.querySelectorAll('input[name="3pl"]').forEach(el => el.setAttribute('aria-invalid', 'false'));
    }

    // 11. Comentarios (máximo 500)
    const comentarios = document.getElementById('comentarios');
    if (comentarios && comentarios.value.length > CONFIG.maxComentarios) {
      markInvalid('comentarios', 'comentarios-error');
      valid = false;
    } else if (comentarios) {
      markValid('comentarios', 'comentarios-error');
    }

    // 12. Privacidad
    const priv = document.getElementById('privacidad');
    if (!priv || !priv.checked) {
      const err = document.getElementById('privacidad-error');
      if (err) {
        err.classList.remove('hidden');
        err.classList.add('visible');
        err.setAttribute('aria-live', 'assertive');
        err.setAttribute('role', 'alert');
      }
      if (priv) priv.setAttribute('aria-invalid', 'true');
      valid = false;
    } else {
      priv.setAttribute('aria-invalid', 'false');
    }

    return valid;
  };

  // ================================================================
  // SUBMIT
  // ================================================================

  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      // Shake animation en el formulario
      const form = document.getElementById(CONFIG.formId);
      if (form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }

      // Enfocar el primer campo con error
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.focus();
        // Si es checkbox/radio, enfocar su primer elemento del grupo
      } else {
        // Fallback: primer .input-error
        const fallback = document.querySelector('.input-error');
        if (fallback) fallback.focus();
      }
      return;
    }

    // ÉXITO — recoger datos para el resumen
    const form = document.getElementById(CONFIG.formId);
    const success = document.getElementById(CONFIG.successId);
    if (!form || !success) return;

    // Construir resumen de datos enviados
    const getVal = id => (document.getElementById(id)?.value || '').trim();
    const getSelectedServicios = () =>
      [...document.querySelectorAll('input[name="servicios"]:checked')].map(cb => cb.value).join(', ');
    const get3pl = () => {
      const checked = document.querySelector('input[name="3pl"]:checked');
      return checked ? checked.value : '';
    };

    const summaryLines = [
      `Empresa: ${getVal('empresa')}`,
      `Contacto: ${getVal('contacto')}`,
      `Email: ${getVal('email')}`,
      `Teléfono: ${getVal('telefono')}`,
      `País: ${getVal('pais')}`,
      `Producto: ${getVal('tipo-producto')}`,
      `Volumen: ${getVal('volumen')}`,
      `Servicios: ${getSelectedServicios() || '(ninguno)'}`,
      `3PL actual: ${get3pl() || '(no especificado)'}`,
    ];

    // Ocultar formulario, mostrar éxito
    form.classList.add('hidden');
    success.classList.remove('hidden');
    success.setAttribute('aria-live', 'polite');
    success.setAttribute('tabindex', '-1');
    success.focus();

    // Insertar resumen en el éxito (opcional, para depuración)
    console.log('[TrackFlow] Formulario enviado correctamente.\n' + summaryLines.join('\n'));
  };

  // ================================================================
  // VALIDACIÓN EN TIEMPO REAL (blur / input / change)
  // ================================================================

  const setupRealTimeValidation = () => {
    // Campos de texto/select
    CONFIG.fields.forEach(({ fieldId, errorId, validator }) => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      // Al perder el foco: validar solo si hay valor o es obligatorio
      field.addEventListener('blur', () => {
        const val = field.value;
        // Si es requerido o hay valor, validar; si está vacío y no es requerido (solo sitio-web), no hacer nada
        if (field.hasAttribute('required') || val) {
          if (validator(val)) {
            markValid(fieldId, errorId);
          } else {
            markInvalid(fieldId, errorId);
          }
        }
      });

      // Al escribir/cambiar: limpiar error inmediatamente (re-valida en blur)
      const clearErrorOnly = () => {
        const error = document.getElementById(errorId);
        if (error && !error.classList.contains('hidden')) {
          // Solo limpia visual si el usuario está corrigiendo
          const field_ = document.getElementById(fieldId);
          if (field_) {
            field_.classList.remove('input-error', 'input-valid');
            field_.removeAttribute('aria-invalid');
            field_.removeAttribute('aria-describedby');
          }
          error.classList.add('hidden');
          error.classList.remove('visible');
          error.removeAttribute('aria-live');
          error.removeAttribute('role');
        }
      };

      field.addEventListener('input', clearErrorOnly);
      field.addEventListener('change', clearErrorOnly);
    });

    // Servicios checkbox
    const setupGroupLiveValidation = (name, errorId) => {
      document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
        el.addEventListener('change', () => {
          const err = document.getElementById(errorId);
          if (isAnyChecked(name)) {
            if (err) { err.classList.add('hidden'); err.classList.remove('visible'); err.removeAttribute('aria-live'); err.removeAttribute('role'); }
            document.querySelectorAll(`input[name="${name}"]`).forEach(cb => cb.setAttribute('aria-invalid', 'false'));
          } else {
            // No mostrar error en tiempo real hasta blur/submit, pero sí marcar aria-invalid
            document.querySelectorAll(`input[name="${name}"]`).forEach(cb => cb.setAttribute('aria-invalid', 'true'));
          }
        });
      });
    };

    setupGroupLiveValidation('servicios', 'servicios-error');
    setupGroupLiveValidation('3pl', '3pl-error');

    // Privacidad
    const priv = document.getElementById('privacidad');
    if (priv) {
      priv.addEventListener('change', () => {
        const err = document.getElementById('privacidad-error');
        if (priv.checked) {
          if (err) { err.classList.add('hidden'); err.classList.remove('visible'); err.removeAttribute('aria-live'); err.removeAttribute('role'); }
          priv.setAttribute('aria-invalid', 'false');
        } else {
          priv.setAttribute('aria-invalid', 'true');
        }
      });
    }
  };

  // ================================================================
  // INICIALIZACIÓN
  // ================================================================

  const init = () => {
    const form = document.getElementById(CONFIG.formId);
    const success = document.getElementById(CONFIG.successId);
    if (!form || !success) return; // No estamos en la página del formulario

    form.addEventListener('submit', handleSubmit);

    // Botón "Enviar otra solicitud" en el mensaje de éxito
    const resetBtn = document.getElementById('reset-after-success');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        clearAll();
        form.classList.remove('hidden');
        success.classList.add('hidden');
        const firstField = form.querySelector('input, select, textarea');
        if (firstField) firstField.focus();
      });
    }

    setupComentariosCounter();
    setupVolumenWarning();
    setupRealTimeValidation();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();