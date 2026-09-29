/**
 * PersonaAvatar — reusable mentor avatar for Infinity Core System
 *
 * <persona-avatar name="Alice" src="public/personas/alice.png" accent="violet"></persona-avatar>
 *
 * Accents: violet | amber | intense | cool
 * Fallback: elegant initial if image missing / error.
 */
(function () {
  'use strict';

  var ACCENT_MAP = {
    violet: 'violet',
    amber: 'amber',
    intense: 'intense',
    cool: 'cool',
    alice: 'violet',
    nexora: 'amber',
    jill: 'intense',
    claire: 'cool'
  };

  function initialFromName(name) {
    var t = String(name || '').trim();
    return t ? t.charAt(0).toUpperCase() : '?';
  }

  class PersonaAvatarElement extends HTMLElement {
    static get observedAttributes() {
      return ['name', 'src', 'accent'];
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    _render() {
      var name = this.getAttribute('name') || '';
      var src = this.getAttribute('src') || '';
      var accentRaw = (this.getAttribute('accent') || 'violet').toLowerCase();
      var accent = ACCENT_MAP[accentRaw] || 'violet';
      var initial = initialFromName(name);

      this.classList.add('persona-avatar');
      this.setAttribute('data-accent', accent);
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', name ? 'Avatar de ' + name : 'Avatar');

      var html =
        '<span class="persona-avatar-glow" aria-hidden="true"></span>' +
        '<span class="persona-avatar-fallback" aria-hidden="true">' +
        '<span class="persona-avatar-initial">' +
        initial +
        '</span></span>';

      if (src) {
        html +=
          '<img class="persona-avatar-img" alt="" decoding="async" loading="lazy" src="' +
          String(src).replace(/"/g, '') +
          '">';
      }

      this.innerHTML = html;
      this.classList.remove('is-loaded', 'is-fallback');

      var img = this.querySelector('.persona-avatar-img');
      var root = this;
      if (img) {
        img.addEventListener('error', function onErr() {
          root.classList.add('is-fallback');
          root.classList.remove('is-loaded');
          img.remove();
        });
        img.addEventListener('load', function onLoad() {
          root.classList.add('is-loaded');
          root.classList.remove('is-fallback');
        });
        if (img.complete && img.naturalWidth > 0) {
          root.classList.add('is-loaded');
        }
      } else {
        this.classList.add('is-fallback');
      }
    }
  }

  function createPersonaAvatar(props) {
    var node = document.createElement('persona-avatar');
    if (props) {
      if (props.name) node.setAttribute('name', props.name);
      if (props.src) node.setAttribute('src', props.src);
      if (props.accent) node.setAttribute('accent', props.accent);
    }
    return node;
  }

  if (!customElements.get('persona-avatar')) {
    customElements.define('persona-avatar', PersonaAvatarElement);
  }

  window.PersonaAvatar = createPersonaAvatar;
})();
