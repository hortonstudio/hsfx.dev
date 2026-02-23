/**
 * Mockup Population Script
 *
 * Reads the master JSON config from a hidden CMS-bound div and
 * populates dynamic DOM elements on the Webflow mockup page.
 *
 * Depends on @hsfx/attr library being loaded first:
 *   - window.hsfx.ready()
 *   - window.hsfx.modules.normalize.clickable.destroy()
 *   - window.hsfx.modules.normalize.dupe.destroy()
 *   - window.hsfx.refresh()
 *
 * IMPORTANT: Uses qs/qsa instead of $/$$  to avoid jQuery collision.
 * Webflow always has jQuery on the page as window.$.
 */
(function () {

// ════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════

function getMockupData() {
  var el = document.querySelector('[data-hs-mockup="master-json"]');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent.trim());
  } catch (e) {
    console.error("[POPULATE] JSON parse failed:", e.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function isElement(node) {
  return node && typeof node.querySelector === 'function';
}

function qs(selector, context) {
  var root = isElement(context) ? context : document;
  return root.querySelector(selector);
}

function qsa(selector, context) {
  var root = isElement(context) ? context : document;
  return Array.from(root.querySelectorAll(selector));
}

function mockup(name, context) {
  return qs('[data-hs-mockup="' + name + '"]', context);
}

function mockupAll(name, context) {
  return qsa('[data-hs-mockup="' + name + '"]', context);
}

function setText(el, text) {
  if (el && text != null) el.textContent = text;
}

function setAttr(el, attr, val) {
  if (isElement(el) && val != null) el.setAttribute(attr, val);
}

/**
 * Set the href on a clickable wrapper.
 * Called AFTER clickable.destroy() — both <a> and <button> exist.
 */
function setHref(container, href) {
  if (!isElement(container)) return;
  var link = qs('.clickable_link', container);
  if (link) link.href = href || '#';
}

/**
 * Set button text on a clickable wrapper.
 * Called AFTER clickable.destroy() — full DOM structure intact.
 */
function setButtonText(container, text) {
  if (!isElement(container) || text == null) return;
  qsa('.button_text', container).forEach(function (el) {
    el.textContent = text;
  });
  var sr = qs('.clickable_text', container);
  if (sr) sr.textContent = text;
}

/**
 * Strip GSAP animation artifacts from a cloned element and its descendants.
 * Removes: transform, opacity, and split-text wrappers.
 */
function cleanClone(el) {
  var targets = [el].concat(Array.from(el.querySelectorAll('[style]')));
  for (var i = 0; i < targets.length; i++) {
    var s = targets[i].style;
    s.removeProperty('transform');
    s.removeProperty('opacity');
    s.removeProperty('translate');
  }
  // Unwrap split-text spans (restore original text)
  var splits = el.querySelectorAll('[data-hs-split], .split-text_word, .split-text_char, .split-text_line');
  for (var j = 0; j < splits.length; j++) {
    var parent = splits[j].parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(splits[j].textContent), splits[j]);
      parent.normalize();
    }
  }
  return el;
}

function setImage(container, src, alt) {
  if (!isElement(container) || !src) return;
  var img = qs('.visual_image', container);
  if (!img) img = qs('img', container);
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
  if (!isElement(parent) || !dataArray || dataArray.length === 0) return;

  var allTemplates = Array.from(parent.querySelectorAll(templateSelector));
  if (allTemplates.length === 0) return;

  var template = allTemplates[0];
  var container = template.parentNode;

  dataArray.forEach(function (item, index) {
    var clone = cleanClone(template.cloneNode(true));
    clone.removeAttribute('data-hs-mockup');
    populateFn(clone, item, index);
    container.appendChild(clone);
  });

  // Remove ALL original templates (not just the first)
  for (var i = 0; i < allTemplates.length; i++) {
    allTemplates[i].remove();
  }
}

/**
 * Populate a footer link clone with text and href.
 */
function populateFooterLink(linkClone, link) {
  var textEl = qs('.footer_link_text', linkClone);
  setText(textEl, link.text);
  var srEl = qs('.clickable_text', linkClone);
  setText(srEl, link.text);
  var linkEl = qs('.clickable_link', linkClone);
  if (linkEl) linkEl.href = link.href || '#';
}

// ════════════════════════════════════════════════════════════
// CONFIG (GLOBAL)
// ════════════════════════════════════════════════════════════

function populateConfig(config) {
  if (!config) return;

  // Logo — all instances (navbar + footer)
  if (config.logo && config.logo.src) {
    mockupAll('logo').forEach(function (wrapper) {
      var img = qs('img', wrapper);
      if (img) {
        img.src = config.logo.src;
        img.alt = config.logo.alt || '';
      }
      setHref(wrapper, '#');
    });
  }

  // Company name
  mockupAll('company').forEach(function (el) {
    setText(el, config.company);
  });

  // Email — all instances (navbar, footer, contact)
  if (config.email) {
    mockupAll('email').forEach(function (wrapper) {
      setButtonText(wrapper, config.email);
      setHref(wrapper, 'mailto:' + config.email);
    });
  }

  // Phone — all instances (navbar top bar, footer, contact)
  if (config.phone) {
    var telHref = 'tel:' + config.phone.replace(/\D/g, '');
    mockupAll('phone').forEach(function (wrapper) {
      setButtonText(wrapper, config.phone);
      setHref(wrapper, telHref);
    });
  }

  // Address — all instances (footer, contact)
  if (config.address) {
    mockupAll('address').forEach(function (wrapper) {
      setButtonText(wrapper, config.address);
    });
  }

  // Socials — CSS hides empty: [data-site-social]:has(a[href=""]) { display: none }
  if (config.socials) {
    var platforms = ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'linkedin', 'pinterest'];
    platforms.forEach(function (platform) {
      var href = config.socials[platform] || '';
      qsa('[data-site-social="' + platform + '"]').forEach(function (wrapper) {
        var link = qs('.clickable_link', wrapper);
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
      var topBarEl = mockup('navbar-top-bar');
      if (topBarEl) topBarEl.style.display = 'none';
    } else {
      // Map button
      if (topBar.map) {
        var mapBtn = mockup('navbar-top-button-map');
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
      var phoneBtn = mockup('navbar-top-button-phone');
      if (phoneBtn && config && config.phone) {
        setButtonText(phoneBtn, config.phone);
        setHref(phoneBtn, 'tel:' + config.phone.replace(/\D/g, ''));
      }
    }
  }

  // ── Desktop Nav Links ──
  var navLinks = navbar.nav_links;
  if (navLinks && navLinks.length > 0) {
    var plainTemplate = mockup('navbar-primary-button');
    var dropdownTemplate = mockup('navbar-main-dropdown');
    var navContainer = qs('.navbar_primary_button_list');

    if (navContainer) {
      navLinks.forEach(function (link) {
        if (link.dropdown && dropdownTemplate) {
          var dropClone = cleanClone(dropdownTemplate.cloneNode(true));
          dropClone.removeAttribute('data-hs-mockup');

          var triggerBtn = mockup('navbar-dropdown-button', dropClone);
          if (triggerBtn) {
            triggerBtn.removeAttribute('data-hs-mockup');
            setButtonText(triggerBtn, link.text);
          }

          var dropItemTemplate = mockup('navbar-dropdown-item', dropClone);
          if (dropItemTemplate) {
            var dropdownContainer = dropItemTemplate.parentNode;
            link.dropdown.forEach(function (item) {
              var itemClone = cleanClone(dropItemTemplate.cloneNode(true));
              itemClone.removeAttribute('data-hs-mockup');
              setButtonText(itemClone, item.text);
              setHref(itemClone, item.href || '#');
              dropdownContainer.appendChild(itemClone);
            });
            dropItemTemplate.remove();
          }

          navContainer.appendChild(dropClone);
        } else if (plainTemplate) {
          var linkClone = cleanClone(plainTemplate.cloneNode(true));
          linkClone.removeAttribute('data-hs-mockup');
          setButtonText(linkClone, link.text);
          setHref(linkClone, link.href || '#');
          navContainer.appendChild(linkClone);
        }
      });

      if (plainTemplate) plainTemplate.remove();
      if (dropdownTemplate) dropdownTemplate.remove();
    }
  }

  // ── Desktop CTA ──
  if (navbar.cta) {
    var desktopCta = mockup('navbar-cta-button');
    if (desktopCta) {
      setButtonText(desktopCta, navbar.cta.text);
      setHref(desktopCta, '#contact');
    }
  }

  // ── Mobile Nav Links ──
  if (navLinks && navLinks.length > 0) {
    var mobilePlainTemplate = mockup('navbar-menu-button');
    var mobileDropTemplate = mockup('navbar-menu-dropdown');
    var mobileContainer = qs('.menu_list');

    if (mobileContainer) {
      navLinks.forEach(function (link) {
        if (link.dropdown && mobileDropTemplate) {
          var mDropClone = cleanClone(mobileDropTemplate.cloneNode(true));
          mDropClone.removeAttribute('data-hs-mockup');

          var mTriggerBtn = mockup('navbar-dropdown-button', mDropClone);
          if (mTriggerBtn) {
            mTriggerBtn.removeAttribute('data-hs-mockup');
            setButtonText(mTriggerBtn, link.text);
          }

          var mDropItemTemplate = mockup('navbar-menu-dropdown-item', mDropClone);
          if (mDropItemTemplate) {
            var mDropContainer = mDropItemTemplate.parentNode;
            link.dropdown.forEach(function (item) {
              var mItemClone = cleanClone(mDropItemTemplate.cloneNode(true));
              mItemClone.removeAttribute('data-hs-mockup');
              setButtonText(mItemClone, item.text);
              setHref(mItemClone, item.href || '#');
              mDropContainer.appendChild(mItemClone);
            });
            mDropItemTemplate.remove();
          }

          mobileContainer.appendChild(mDropClone);
        } else if (mobilePlainTemplate) {
          var mClone = cleanClone(mobilePlainTemplate.cloneNode(true));
          mClone.removeAttribute('data-hs-mockup');
          setButtonText(mClone, link.text);
          setHref(mClone, link.href || '#');
          mobileContainer.appendChild(mClone);
        }
      });

      if (mobilePlainTemplate) mobilePlainTemplate.remove();
      if (mobileDropTemplate) mobileDropTemplate.remove();
    }
  }

  // ── Mobile CTA ──
  if (navbar.cta) {
    var mobileCta = mockup('navbar-menu-cta');
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
    var minimalList = mockup('footer-minimal-main-list');
    if (minimalList) {
      dupeList(minimalList, '[data-hs-mockup="footer-link"]', footer.footer_nav, function (clone, link) {
        populateFooterLink(clone, link);
      });
    }
  }

  // ── Full Variant: footer_groups ──
  if (footer.footer_groups && footer.footer_groups.length > 0) {
    var allGroups = mockupAll('footer-group');
    if (allGroups.length === 0) return;

    var savedTemplate = cleanClone(allGroups[0].cloneNode(true));
    var groupContainer = allGroups[0].parentNode;

    // Build combined data: user groups + contact group
    var allGroupData = footer.footer_groups.slice();
    if (config) {
      var contactLinks = [];
      if (config.phone) contactLinks.push({ text: config.phone, href: 'tel:' + config.phone.replace(/\D/g, '') });
      if (config.email) contactLinks.push({ text: config.email, href: 'mailto:' + config.email });
      if (config.address) contactLinks.push({ text: config.address, href: '' });
      if (contactLinks.length > 0) {
        allGroupData.push({ heading: 'Contact', links: contactLinks });
      }
    }

    allGroupData.forEach(function (group) {
      var groupClone = cleanClone(savedTemplate.cloneNode(true));
      groupClone.removeAttribute('data-hs-mockup');

      var headingEl = qs('.footer_group_heading', groupClone);
      setText(headingEl, group.heading);

      dupeList(groupClone, '[data-hs-mockup="footer-link"]', group.links, function (linkClone, link) {
        populateFooterLink(linkClone, link);
      });

      groupContainer.appendChild(groupClone);
    });

    allGroups.forEach(function (el) { el.remove(); });
  }
}

// ════════════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════════════

function populateServices(services) {
  if (!services || !services.cards || services.cards.length === 0) return;

  // ── Three Grid ──
  var gridSection = mockup('services-three-grid');
  if (gridSection) {
    dupeList(gridSection, '[data-hs-mockup="services-card-grid"]', services.cards, function (card, data) {
      var visual = mockup('visual', card);
      if (visual && data.image_url) {
        setImage(visual, data.image_url, data.heading);
      }
      var hWrap = mockup('heading', card);
      if (hWrap) setText(qs('h3', hWrap) || qs('h2', hWrap), data.heading);
      var pWrap = mockup('paragraph', card);
      if (pWrap) setText(qs('p', pWrap), data.paragraph);
    });
  }

  // ── Sticky List ──
  var listSection = mockup('services-sticky-list');
  if (listSection) {
    dupeList(listSection, '[data-hs-mockup="services-card-list"]', services.cards, function (card, data) {
      var hWrap = mockup('heading', card);
      if (hWrap) setText(qs('h3', hWrap) || qs('h2', hWrap), data.heading);
      var pWrap = mockup('paragraph', card);
      if (pWrap) setText(qs('p', pWrap), data.paragraph);
    });
  }
}

// ════════════════════════════════════════════════════════════
// PROCESS
// ════════════════════════════════════════════════════════════

function populateProcess(process) {
  if (!process || !process.steps || process.steps.length === 0) return;

  // ── Sticky List ──
  var listSection = mockup('process-list');
  if (listSection) {
    dupeList(listSection, '[data-hs-mockup="process-card-list"]', process.steps, function (card, step, index) {
      var iconText = mockup('icon-text', card);
      setText(iconText, String(index + 1));

      var hWrap = mockup('heading', card);
      if (hWrap) setText(qs('h3', hWrap) || qs('h2', hWrap), step.heading);

      var pWrap = mockup('paragraph', card);
      if (pWrap) setText(qs('p', pWrap), step.paragraph);

      if (step.features && step.features.length > 0) {
        dupeList(card, '[data-hs-mockup="feature-item"]', step.features, function (featureEl, featureText) {
          var textEl = qs('.feature_item_text', featureEl);
          setText(textEl, featureText);
        });
      } else {
        mockupAll('feature-item', card).forEach(function (el) {
          el.remove();
        });
      }
    });
  }

  // ── Card Grid ──
  var gridSection = mockup('process-grid');
  if (gridSection) {
    dupeList(gridSection, '[data-hs-mockup="process-grid-card"]', process.steps, function (card, step, index) {
      var iconText = mockup('icon-text', card);
      setText(iconText, String(index + 1));

      var hWrap = mockup('heading', card);
      if (hWrap) setText(qs('h3', hWrap) || qs('h2', hWrap), step.heading);

      var pWrap = mockup('paragraph', card);
      if (pWrap) setText(qs('p', pWrap), step.paragraph);
    });
  }
}

// ════════════════════════════════════════════════════════════
// STATS / BENEFITS
// ════════════════════════════════════════════════════════════

function populateStatsBenefits(statsBenefits) {
  if (!statsBenefits || !statsBenefits.cards || statsBenefits.cards.length === 0) return;

  ['stat-card', 'benefit-card'].forEach(function (cardType) {
    var cards = mockupAll(cardType);
    cards.forEach(function (card, i) {
      var data = statsBenefits.cards[i];
      if (!data) return;

      var iconSlot = mockup('icon-slot', card);
      if (iconSlot && data.icon_svg) {
        iconSlot.innerHTML = data.icon_svg;
      }

      var headingWrap = mockup('heading', card);
      if (headingWrap) {
        var hTag = qs('h2', headingWrap) || qs('h3', headingWrap);
        setText(hTag, data.heading);
      }

      var pWrap = mockup('paragraph', card);
      if (pWrap) setText(qs('p', pWrap), data.paragraph);
    });
  });
}

// ════════════════════════════════════════════════════════════
// TESTIMONIALS
// ════════════════════════════════════════════════════════════

function populateTestimonials(testimonials) {
  if (!testimonials) return;

  var marqueeRows = qsa('.marquee_list:not([aria-hidden="true"])');
  var rowData = [testimonials.top_row, testimonials.bottom_row];

  marqueeRows.forEach(function (row, rowIndex) {
    var reviews = rowData[rowIndex];
    if (!reviews || reviews.length === 0) return;

    dupeList(row, '[data-hs-mockup="testimonial-card"]', reviews, function (card, review) {
      var paragraphs = mockupAll('paragraph', card);
      if (paragraphs[0]) setText(qs('p', paragraphs[0]), review.review);
      if (paragraphs[1]) setText(qs('p', paragraphs[1]), review.name);
    });
  });
}

// ════════════════════════════════════════════════════════════
// FAQ
// ════════════════════════════════════════════════════════════

function populateFAQ(faq) {
  if (!faq || !faq.items || faq.items.length === 0) return;

  var faqSection = mockup('faq-center') || mockup('faq-two-grid');
  if (!faqSection) return;

  dupeList(faqSection, '[data-hs-mockup="accordion-item"]', faq.items, function (item, faqData, index) {
    var toggleText = qs('.accordion_toggle_text', item);
    setText(toggleText, faqData.question);

    var answerText = qs('.accordion_text', item);
    setText(answerText, faqData.answer);

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
      var input = qs('input[name="' + name + '"]');
      if (!input) return;

      var wrapper = input.closest('[data-hs-mockup="form-input"]');
      if (wrapper) {
        var label = qs('.form_label_text', wrapper);
        setText(label, field.label);
      }
      setAttr(input, 'placeholder', field.placeholder);
    });
  }

  // ── Textarea ──
  if (form.textarea) {
    Object.keys(form.textarea).forEach(function (name) {
      var field = form.textarea[name];
      var textarea = qs('textarea[name="' + name + '"]');
      if (!textarea) return;

      var wrapper = textarea.closest('[data-hs-mockup="form-text-area"]');
      if (wrapper) {
        var label = qs('.form_label_text', wrapper);
        setText(label, field.label);
      }
      setAttr(textarea, 'placeholder', field.placeholder);
    });
  }

  // ── Checkbox ──
  if (form.checkbox_text) {
    var checkboxWrapper = mockup('form-checkbox');
    if (checkboxWrapper) {
      var uiText = qs('.form_ui_text', checkboxWrapper);
      setText(uiText, form.checkbox_text);
    }
  }

  // ── Submit Button ──
  if (form.submit_button) {
    var submitBtn = mockup('form-submit');
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

  // Restore full DOM — clickable re-inserts removed <a>/<button> elements
  window.hsfx.modules.normalize.clickable.destroy();
  // Remove dupe clones so we start from clean templates
  window.hsfx.modules.normalize.dupe.destroy();

  populateConfig(data.config);
  populateNavbar(data.navbar, data.config);
  populateFooter(data.footer, data.config);
  populateServices(data.services);
  populateProcess(data.process);
  populateStatsBenefits(data.stats_benefits);
  populateTestimonials(data.testimonials);
  populateFAQ(data.faq);
  populateContact(data.contact, data.config);

  // Re-normalize: dupe → clickable → marquee → modules
  await window.hsfx.refresh();
});

})();