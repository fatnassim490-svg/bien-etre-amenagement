/* ==========================================================================
   BIEN-ÊTRE AMÉNAGEMENT — script.js
   Sommaire :
   1. Année dynamique dans le footer
   2. Effet de fond au scroll sur le header
   3. Menu burger mobile
   4. Fermeture du menu au clic sur un lien
   5. Animations au scroll (IntersectionObserver)
   6. Validation + envoi du formulaire de contact (Formspree)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Année dynamique dans le footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Effet de fond au scroll sur le header ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- 3. Menu burger mobile ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const navClose = document.getElementById('nav-close');

  function toggleMenu(forceClose = false) {
    const isOpen = forceClose ? false : !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  burger.addEventListener('click', () => toggleMenu());

  // Fermeture du menu via la croix (X) placée dans la barre supérieure du panneau
  if (navClose) {
    navClose.addEventListener('click', () => toggleMenu(true));
  }

  /* ---------- 4. Fermeture du menu au clic sur un lien ---------- */
  nav.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  /* ---------- 5bis. Galerie : pause du défilement au toucher (mobile) ---------- */
  // La pause au survol souris est gérée en CSS (:hover). Sur mobile, il n'y a pas
  // de survol : on met donc en pause tant que l'utilisateur touche la galerie.
  const galleryTrack = document.getElementById('gallery-track');
  if (galleryTrack) {
    galleryTrack.addEventListener('touchstart', () => galleryTrack.classList.add('is-paused'), { passive: true });
    galleryTrack.addEventListener('touchend', () => galleryTrack.classList.remove('is-paused'), { passive: true });
  }

  /* ---------- 5. Animations au scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Petit décalage progressif pour un effet plus premium sur les grilles
        const delay = entry.target.dataset.revealDelay || 0;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el, index) => {
    // Décalage léger pour les éléments d'une même grille (cartes valeurs/services/témoignages)
    el.dataset.revealDelay = (index % 3) * 90;
    revealObserver.observe(el);
  });

  /* ---------- 6. Validation + envoi du formulaire de contact (vers WhatsApp) ---------- */
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  // Numéro WhatsApp de destination (format international, sans "+")
  const WHATSAPP_NUMBER = '213554602842';

  // Libellés lisibles pour les valeurs du menu déroulant "Type de projet"
  const projectLabels = {
    design: "Design d'espace",
    batiment: 'Travaux de bâtiment',
    renovation: 'Construction & Rénovation',
    autre: 'Autre',
  };

  const validators = {
    name: (value) => value.trim().length >= 2,
    phone: (value) => /^[0-9+\s()-]{8,}$/.test(value.trim()),
    email: (value) => value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message: (value) => value.trim() === '' || value.trim().length >= 10,
  };

  const errorMessages = {
    name: 'Merci de renseigner votre nom (2 caractères minimum).',
    phone: 'Merci de renseigner un numéro de téléphone valide.',
    email: 'Merci de renseigner une adresse e-mail valide.',
    message: 'Merci de décrire votre projet en quelques mots (10 caractères minimum).',
  };

  function setFieldError(field, message) {
    const input = form.elements[field];
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    if (message) {
      input.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = message;
    } else {
      input.classList.remove('is-invalid');
      if (errorEl) errorEl.textContent = '';
    }
  }

  function validateForm() {
    let isValid = true;
    Object.keys(validators).forEach((field) => {
      const value = form.elements[field].value;
      const fieldIsValid = validators[field](value);
      setFieldError(field, fieldIsValid ? '' : errorMessages[field]);
      if (!fieldIsValid) isValid = false;
    });
    return isValid;
  }

  // Validation en direct dès que l'utilisateur quitte un champ
  Object.keys(validators).forEach((field) => {
    form.elements[field].addEventListener('blur', () => {
      const value = form.elements[field].value;
      setFieldError(field, validators[field](value) ? '' : errorMessages[field]);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    if (!validateForm()) {
      statusEl.textContent = 'Merci de corriger les champs indiqués ci-dessus.';
      statusEl.classList.add('error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const initialLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Préparation du message...';

    try {
      // Récupération des valeurs des champs
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const phone = form.elements.phone.value.trim();
      const projectValue = form.elements.project.value;
      const project = projectLabels[projectValue] || projectValue;
      const message = form.elements.message.value.trim();

      // Construction d'un texte propre et structuré pour WhatsApp
      const lines = [
        'Nouvelle demande de contact — Bien-être Aménagement',
        '',
        `Nom complet : ${name}`,
      ];
      if (email) lines.push(`E-mail : ${email}`);
      lines.push(`Téléphone : ${phone}`, `Type de projet : ${project}`);
      if (message) lines.push('', `Message : ${message}`);
      const whatsappText = lines.join('\n');

      // Génération du lien WhatsApp avec le message pré-rempli
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

      statusEl.textContent = 'Redirection vers WhatsApp...';
      statusEl.classList.add('success');

      // Ouverture de WhatsApp dans un nouvel onglet
      window.open(whatsappUrl, '_blank', 'noopener');

      form.reset();
    } catch (error) {
      statusEl.textContent = 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = initialLabel;
    }
  });

});
