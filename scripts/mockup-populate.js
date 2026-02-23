/**
 * Mockup Population Script
 *
 * Reads the master JSON config from a hidden CMS-bound div and
 * populates dynamic DOM elements on the Webflow mockup page.
 *
 * Depends on @hsfx/attr library being loaded first:
 *   - window.hsfx.ready()
 *   - window.hsfx.modules.normalize.dupe.destroy()
 *   - window.hsfx.refresh()
 *
 * What this script handles (from master JSON):
 *   - config: logo, company, email, phone, address, socials (global shared)
 *   - navbar: top bar, nav links, dropdowns, CTA (desktop + mobile)
 *   - footer: footer_nav (minimal), footer_groups (full), contact group
 *   - services: Three Grid cards (with images) + Sticky List cards
 *   - process: Sticky List steps (with features) + Card Grid steps
 *   - stats_benefits: 4 cards with icon SVG injection
 *   - testimonials: two-row marquee, 4 cards per row
 *   - faq: accordion items
 *   - contact: form labels/placeholders, checkbox text, submit button
 *
 * What Webflow CMS handles (NOT this script):
 *   - Section headings, tags, paragraphs, button text
 *   - Variant selection (which layout is visible)
 *   - Hero, About, CTA sections (all WF-bound)
 *   - CSS override injection (Rich Text field)
 */

// ════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════

function getMockupData() {
  var el = document.querySelector('[data-hs-mockup="master-json"]');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent.trim());
  } catch (e) {
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function $(selector, context) {
  return (context || document).querySelector(selector);
}

function $$(selector, context) {
  return Array.from((context || document).querySelectorAll(selector));
}

function setText(el, text) {
  if (el && text != null) el.textContent = text;
}

function setAttr(el, attr, val) {
  if (el && val != null) el.setAttribute(attr, val);
}

function setHref(container, href) {
  if (!container) return;
  var link = $('.clickable_link', container) || $('.clickable_button', container);
  if (link) link.href = href;
}

function setButtonText(container, text) {
  if (!container || text == null) return;
  $$('.button_text', container).forEach(function (el) {
    el.textContent = text;
  });
  var sr = $('.clickable_text', container);
  if (sr) sr.textContent = text;
}

function setImage(container, src, alt) {
  if (!container || !src) return;
  var img = $('.visual_image', container);
  if (!img) img = $('img', container);
  if (img) {
    img.src = src;
    if (alt) img.alt = alt;
  }
}

/**
 * Core duplication engine.
 * Finds the first element matching templateSelector inside parent,
 * clones it for each item in dataArray, calls populateFn on each clone,
 * appends clones to the same parent, then removes the original template.
 */
function dupeList(parent, templateSelector, dataArray, populateFn) {
  if (!parent || !dataArray || dataArray.length === 0) return;

  var template = parent.querySelector(templateSelector);
  if (!template) return;

  var container = template.parentNode;

  dataArray.forEach(function (item, index) {
    var clone = template.cloneNode(true);
    clone.removeAttribute('data-hs-mockup');
    populateFn(clone, item, index);
    container.appendChild(clone);
  });

  template.remove();
}

// ════════════════════════════════════════════════════════════
// CONFIG (GLOBAL)
// ════════════════════════════════════════════════════════════

function populateConfig(config) {
  if (!config) return;

  // Logo — all instances (navbar + footer)
  if (config.logo && config.logo.src) {
    $$('[data-hs-mockup="logo"]').forEach(function (wrapper) {
      var img = $('img', wrapper);
      if (img) {
        img.src = config.logo.src;
        img.alt = config.logo.alt || '';
      }
      setHref(wrapper, '#');
    });
  }

  // Company name
  $$('[data-hs-mockup="company"]').forEach(function (el) {
    setText(el, config.company);
  });

  // Email — all instances (navbar, footer, contact)
  if (config.email) {
    $$('[data-hs-mockup="email"]').forEach(function (wrapper) {
      setButtonText(wrapper, config.email);
      setHref(wrapper, 'mailto:' + config.email);
    });
  }

  // Phone — all instances (navbar top bar, footer, contact)
  if (config.phone) {
    var telHref = 'tel:' + config.phone.replace(/\D/g, '');
    $$('[data-hs-mockup="phone"]').forEach(function (wrapper) {
      setButtonText(wrapper, config.phone);
      setHref(wrapper, telHref);
    });
  }

  // Address — all instances (footer, contact)
  if (config.address) {
    $$('[data-hs-mockup="address"]').forEach(function (wrapper) {
      setButtonText(wrapper, config.address);
    });
  }

  // Socials — CSS hides empty: [data-site-social]:has(a[href=""]) { display: none }
  if (config.socials) {
    var platforms = ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'linkedin', 'pinterest'];
    platforms.forEach(function (platform) {
      var href = config.socials[platform] || '';
      $$('[data-site-social="' + platform + '"]').forEach(function (wrapper) {
        var link = $('.clickable_link', wrapper);
        if (link) link.href = href;
      });
    });
  }
}

// ════════════════════════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════════════════════════

function populateNavbar(navbar, config) {
  if (!navbar) return;

  // ── Top Bar ──
  var topBar = navbar.top_bar;
  if (topBar) {
    if (topBar.show === false) {
      // Hide the entire top bar strip
      var topBarEl = $('[data-hs-mockup="navbar-top-bar"]');
      if (topBarEl) topBarEl.style.display = 'none';
    } else {
      // Map button
      if (topBar.map) {
        var mapBtn = $('[data-hs-mockup="navbar-top-button-map"]');
        if (mapBtn) {
          if (topBar.map.show === false) {
            mapBtn.style.display = 'none';
          } else {
            setButtonText(mapBtn, topBar.map.text);
            setHref(mapBtn, topBar.map.href || '#service-area');
          }
        }
      }

      // Phone button — uses config.phone
      var phoneBtn = $('[data-hs-mockup="navbar-top-button-phone"]');
      if (phoneBtn && config && config.phone) {
        setButtonText(phoneBtn, config.phone);
        setHref(phoneBtn, 'tel:' + config.phone.replace(/\D/g, ''));
      }
    }
  }

  // ── Desktop Nav Links ──
  var navLinks = navbar.nav_links;
  if (navLinks && navLinks.length > 0) {
    // Find desktop nav container
    var plainTemplate = $('[data-hs-mockup="navbar-link-button"]');
    var dropdownTemplate = $('[data-hs-mockup="navbar-dropdown-button"]');
    var navContainer = plainTemplate ? plainTemplate.parentNode : null;

    if (navContainer) {
      navLinks.forEach(function (link) {
        if (link.dropdown) {
          // Dropdown link
          if (dropdownTemplate) {
            var dropClone = dropdownTemplate.cloneNode(true);
            dropClone.removeAttribute('data-hs-mockup');

            // Set dropdown trigger text
            setButtonText(dropClone, link.text);

            // Populate dropdown items
            var dropdownItemTemplate = $('[data-hs-mockup="navbar-dropdown-item"]', dropClone);
            if (dropdownItemTemplate) {
              var dropdownContainer = dropdownItemTemplate.parentNode;
              link.dropdown.forEach(function (item) {
                var itemClone = dropdownItemTemplate.cloneNode(true);
                itemClone.removeAttribute('data-hs-mockup');
                setButtonText(itemClone, item.text);
                setHref(itemClone, item.href || '#');
                dropdownContainer.appendChild(itemClone);
              });
              dropdownItemTemplate.remove();
            }

            navContainer.appendChild(dropClone);
          }
        } else {
          // Plain link
          if (plainTemplate) {
            var linkClone = plainTemplate.cloneNode(true);
            linkClone.removeAttribute('data-hs-mockup');
            setButtonText(linkClone, link.text);
            setHref(linkClone, link.href || '#');
            navContainer.appendChild(linkClone);
          }
        }
      });

      // Remove templates
      if (plainTemplate) plainTemplate.remove();
      if (dropdownTemplate) dropdownTemplate.remove();
    }
  }

  // ── Desktop CTA ──
  if (navbar.cta) {
    var desktopCta = $('[data-hs-mockup="navbar-cta"]');
    if (desktopCta) {
      setButtonText(desktopCta, navbar.cta.text);
      setHref(desktopCta, '#contact');
    }
  }

  // ── Mobile Nav Links ──
  if (navLinks && navLinks.length > 0) {
    var mobileTemplate = $('[data-hs-mockup="navbar-menu-button"]');
    var mobileContainer = mobileTemplate ? mobileTemplate.parentNode : null;

    if (mobileContainer) {
      navLinks.forEach(function (link) {
        if (link.dropdown) {
          // Flatten dropdowns into plain mobile links
          // First add the trigger as a link
          var triggerClone = mobileTemplate.cloneNode(true);
          triggerClone.removeAttribute('data-hs-mockup');
          setButtonText(triggerClone, link.text);
          setHref(triggerClone, link.dropdown[0] ? link.dropdown[0].href : '#');
          mobileContainer.appendChild(triggerClone);

          // Then add each dropdown item
          link.dropdown.forEach(function (item) {
            var itemClone = mobileTemplate.cloneNode(true);
            itemClone.removeAttribute('data-hs-mockup');
            setButtonText(itemClone, item.text);
            setHref(itemClone, item.href || '#');
            mobileContainer.appendChild(itemClone);
          });
        } else {
          var clone = mobileTemplate.cloneNode(true);
          clone.removeAttribute('data-hs-mockup');
          setButtonText(clone, link.text);
          setHref(clone, link.href || '#');
          mobileContainer.appendChild(clone);
        }
      });

      mobileTemplate.remove();
    }
  }

  // ── Mobile CTA ──
  if (navbar.cta) {
    var mobileCta = $('[data-hs-mockup="navbar-menu-cta"]');
    if (mobileCta) {
      setButtonText(mobileCta, navbar.cta.text);
      setHref(mobileCta, '#contact');
    }
  }
}

// ════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════

function populateFooter(footer, config) {
  if (!footer) return;

  // ── Minimal Variant: footer_nav ──
  if (footer.footer_nav && footer.footer_nav.length > 0) {
    var minimalList = $('[data-hs-mockup="footer-minimal-main-list"]');
    if (minimalList) {
      dupeList(minimalList, '[data-hs-mockup="footer-link"]', footer.footer_nav, function (clone, link) {
        var textEl = $('.footer_link_text', clone);
        setText(textEl, link.text);
        var srEl = $('.clickable_text', clone);
        setText(srEl, link.text);
        var linkEl = $('.clickable_link', clone);
        if (linkEl) linkEl.href = link.href || '#';
      });
    }
  }

  // ── Full Variant: footer_groups ──
  if (footer.footer_groups && footer.footer_groups.length > 0) {
    var groupTemplate = $('[data-hs-mockup="footer-group"]');
    if (groupTemplate) {
      var groupContainer = groupTemplate.parentNode;

      footer.footer_groups.forEach(function (group) {
        var groupClone = groupTemplate.cloneNode(true);
        groupClone.removeAttribute('data-hs-mockup');

        // Set group heading
        var headingEl = $('.footer_group_heading', groupClone);
        setText(headingEl, group.heading);

        // Populate links inside this group
        dupeList(groupClone, '[data-hs-mockup="footer-link"]', group.links, function (linkClone, link) {
          var textEl = $('.footer_link_text', linkClone);
          setText(textEl, link.text);
          var srEl = $('.clickable_text', linkClone);
          setText(srEl, link.text);
          var linkEl = $('.clickable_link', linkClone);
          if (linkEl) linkEl.href = link.href || '#';
        });

        groupContainer.appendChild(groupClone);
      });

      // Auto-append contact group from config
      if (config) {
        var contactLinks = [];
        if (config.phone) contactLinks.push({ text: config.phone, href: 'tel:' + config.phone.replace(/\D/g, '') });
        if (config.email) contactLinks.push({ text: config.email, href: 'mailto:' + config.email });
        if (config.address) contactLinks.push({ text: config.address, href: '' });

        if (contactLinks.length > 0) {
          var contactGroup = groupTemplate.cloneNode(true);
          contactGroup.removeAttribute('data-hs-mockup');
          var contactHeading = $('.footer_group_heading', contactGroup);
          setText(contactHeading, 'Contact');

          dupeList(contactGroup, '[data-hs-mockup="footer-link"]', contactLinks, function (linkClone, link) {
            var textEl = $('.footer_link_text', linkClone);
            setText(textEl, link.text);
            var srEl = $('.clickable_text', linkClone);
            setText(srEl, link.text);
            var linkEl = $('.clickable_link', linkClone);
            if (linkEl) linkEl.href = link.href || '';
          });

          groupContainer.appendChild(contactGroup);
        }
      }

      groupTemplate.remove();
    }
  }
}

// ════════════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════════════

function populateServices(services) {
  if (!services || !services.cards || services.cards.length === 0) return;

  // ── Three Grid ──
  var gridSection = document.getElementById('services-three-grid');
  if (gridSection) {
    var gridTemplate = $('[data-hs-mockup="services-card-grid"]', gridSection);
    if (gridTemplate) {
      var gridContainer = gridTemplate.parentNode;
      dupeList(gridContainer, '[data-hs-mockup="services-card-grid"]', services.cards, function (card, data) {
        // Image
        var visual = card.querySelector('[data-hs-mockup="visual"]');
        if (visual && data.image_url) {
          setImage(visual, data.image_url, data.heading);
        }
        // Heading
        var h3 = card.querySelector('[data-hs-mockup="heading"]');
        if (h3) setText($('h3', h3), data.heading);
        // Paragraph
        var pWrap = card.querySelector('[data-hs-mockup="paragraph"]');
        if (pWrap) setText($('p', pWrap), data.paragraph);
        // Button text comes from WF CMS Services Button field — skip
      });
    }
  }

  // ── Sticky List ──
  var listSection = document.getElementById('services-sticky-list');
  if (listSection) {
    var listTemplate = $('[data-hs-mockup="services-card-list"]', listSection);
    if (listTemplate) {
      var listContainer = listTemplate.parentNode;
      dupeList(listContainer, '[data-hs-mockup="services-card-list"]', services.cards, function (card, data) {
        var h3 = card.querySelector('[data-hs-mockup="heading"]');
        if (h3) setText($('h3', h3), data.heading);
        var pWrap = card.querySelector('[data-hs-mockup="paragraph"]');
        if (pWrap) setText($('p', pWrap), data.paragraph);
      });
    }
  }
}

// ════════════════════════════════════════════════════════════
// PROCESS
// ════════════════════════════════════════════════════════════

function populateProcess(process) {
  if (!process || !process.steps || process.steps.length === 0) return;

  // ── Sticky List ──
  var listSection = document.getElementById('process-sticky-list');
  if (listSection) {
    var listTemplate = $('[data-hs-mockup="process-card-list"]', listSection);
    if (listTemplate) {
      dupeList(listTemplate.parentNode, '[data-hs-mockup="process-card-list"]', process.steps, function (card, step, index) {
        // Step number
        var iconText = card.querySelector('[data-hs-mockup="icon-text"]');
        setText(iconText, String(index + 1));

        // Heading
        var h3 = card.querySelector('[data-hs-mockup="heading"]');
        if (h3) setText($('h3', h3), step.heading);

        // Paragraph
        var pWrap = card.querySelector('[data-hs-mockup="paragraph"]');
        if (pWrap) setText($('p', pWrap), step.paragraph);

        // Features (optional)
        if (step.features && step.features.length > 0) {
          dupeList(card, '[data-hs-mockup="feature-item"]', step.features, function (featureEl, featureText) {
            var textEl = $('.feature_item_text', featureEl);
            setText(textEl, featureText);
          });
        } else {
          // Remove all feature items if no features
          $$('[data-hs-mockup="feature-item"]', card).forEach(function (el) {
            el.remove();
          });
        }
      });
    }
  }

  // ── Card Grid ──
  var gridSection = document.getElementById('process-card-grid');
  if (gridSection) {
    var gridTemplate = $('[data-hs-mockup="process-grid-card"]', gridSection);
    if (gridTemplate) {
      dupeList(gridTemplate.parentNode, '[data-hs-mockup="process-grid-card"]', process.steps, function (card, step, index) {
        var iconText = card.querySelector('[data-hs-mockup="icon-text"]');
        setText(iconText, String(index + 1));

        var h3 = card.querySelector('[data-hs-mockup="heading"]');
        if (h3) setText($('h3', h3), step.heading);

        var pWrap = card.querySelector('[data-hs-mockup="paragraph"]');
        if (pWrap) setText($('p', pWrap), step.paragraph);
      });
    }
  }
}

// ════════════════════════════════════════════════════════════
// STATS / BENEFITS
// ════════════════════════════════════════════════════════════

function populateStatsBenefits(statsBenefits) {
  if (!statsBenefits || !statsBenefits.cards || statsBenefits.cards.length === 0) return;

  // Both stat-card and benefit-card use the same structure.
  // Only one set is visible at a time (controlled by WF CMS option).
  // Always 4 pre-existing cards — populate by index, no duplication.
  ['stat-card', 'benefit-card'].forEach(function (cardType) {
    var cards = $$('[data-hs-mockup="' + cardType + '"]');
    cards.forEach(function (card, i) {
      var data = statsBenefits.cards[i];
      if (!data) return;

      // Icon SVG injection
      var iconSlot = card.querySelector('[data-hs-mockup="icon-slot"]');
      if (iconSlot && data.icon_svg) {
        iconSlot.innerHTML = data.icon_svg;
      }

      // Heading (h2 for stat cards, h3 for benefit cards)
      var headingWrap = card.querySelector('[data-hs-mockup="heading"]');
      if (headingWrap) {
        var hTag = $('h2', headingWrap) || $('h3', headingWrap);
        setText(hTag, data.heading);
      }

      // Paragraph
      var pWrap = card.querySelector('[data-hs-mockup="paragraph"]');
      if (pWrap) setText($('p', pWrap), data.paragraph);
    });
  });
}

// ════════════════════════════════════════════════════════════
// TESTIMONIALS
// ════════════════════════════════════════════════════════════

function populateTestimonials(testimonials) {
  if (!testimonials) return;

  // Only target marquee_list elements WITHOUT aria-hidden="true".
  // The aria-hidden ones are auto-duped by the marquee engine.
  var marqueeRows = $$('.marquee_list:not([aria-hidden="true"])');
  var rowData = [testimonials.top_row, testimonials.bottom_row];

  marqueeRows.forEach(function (row, rowIndex) {
    var reviews = rowData[rowIndex];
    if (!reviews || reviews.length === 0) return;

    dupeList(row, '[data-hs-mockup="testimonial-card"]', reviews, function (card, review) {
      var paragraphs = $$('[data-hs-mockup="paragraph"]', card);

      // First paragraph = review text
      if (paragraphs[0]) setText($('p', paragraphs[0]), review.review);

      // Second paragraph (u-weight-bold) = reviewer name
      if (paragraphs[1]) setText($('p', paragraphs[1]), review.name);
    });
  });
}

// ════════════════════════════════════════════════════════════
// FAQ
// ════════════════════════════════════════════════════════════

function populateFAQ(faq) {
  if (!faq || !faq.items || faq.items.length === 0) return;

  // Find the accordion container — parent of the first accordion item
  var firstItem = $('[data-hs-mockup="accordion-item"]');
  if (!firstItem) return;

  var accordionContainer = firstItem.parentNode;

  dupeList(accordionContainer, '[data-hs-mockup="accordion-item"]', faq.items, function (item, faqData, index) {
    // Question
    var toggleText = $('.accordion_toggle_text', item);
    setText(toggleText, faqData.question);

    // Answer
    var answerText = $('.accordion_text', item);
    setText(answerText, faqData.answer);

    // Only first item stays open
    if (index > 0) {
      item.removeAttribute('data-hs-accordion-open');
    }
  });
}

// ════════════════════════════════════════════════════════════
// CONTACT
// ════════════════════════════════════════════════════════════

function populateContact(contact, config) {
  if (!contact || !contact.form) return;

  var form = contact.form;

  // ── Form Inputs ──
  if (form.inputs) {
    Object.keys(form.inputs).forEach(function (name) {
      var field = form.inputs[name];
      // Find the input by name, then traverse to its wrapper
      var input = $('input[name="' + name + '"]');
      if (!input) return;

      var wrapper = input.closest('[data-hs-mockup="form-input"]');
      if (wrapper) {
        var label = $('.form_label_text', wrapper);
        setText(label, field.label);
      }
      setAttr(input, 'placeholder', field.placeholder);
    });
  }

  // ── Textarea ──
  if (form.textarea) {
    Object.keys(form.textarea).forEach(function (name) {
      var field = form.textarea[name];
      var textarea = $('textarea[name="' + name + '"]');
      if (!textarea) return;

      var wrapper = textarea.closest('[data-hs-mockup="form-text-area"]');
      if (wrapper) {
        var label = $('.form_label_text', wrapper);
        setText(label, field.label);
      }
      setAttr(textarea, 'placeholder', field.placeholder);
    });
  }

  // ── Checkbox ──
  if (form.checkbox_text) {
    var checkboxWrapper = $('[data-hs-mockup="form-checkbox"]');
    if (checkboxWrapper) {
      var uiText = $('.form_ui_text', checkboxWrapper);
      setText(uiText, form.checkbox_text);
    }
  }

  // ── Submit Button ──
  if (form.submit_button) {
    var submitBtn = $('[data-hs-mockup="form-submit"]');
    if (submitBtn) {
      setButtonText(submitBtn, form.submit_button);
    }
  }
}

// ════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ════════════════════════════════════════════════════════════

window.hsfx.ready(async function () {
  var data = getMockupData();
  if (!data) return;

  // Clear existing dupe clones from any previous run
  window.hsfx.modules.normalize.dupe.destroy();

  // Populate in dependency order — config first (shared data)
  populateConfig(data.config);
  populateNavbar(data.navbar, data.config);
  populateFooter(data.footer, data.config);
  populateServices(data.services);
  populateProcess(data.process);
  populateStatsBenefits(data.stats_benefits);
  populateTestimonials(data.testimonials);
  populateFAQ(data.faq);
  populateContact(data.contact, data.config);

  // Reinitialize all hsfx attribute handlers on the mutated DOM
  await window.hsfx.refresh();
});
