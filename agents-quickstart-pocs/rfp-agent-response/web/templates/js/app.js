// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// Shared browser code for the RFP web UI:
//
// * Escaping helpers. Every page renders data that comes from users or from
//   the model (file names, answers, error messages, query string values).
//   Any such value placed into innerHTML must go through escapeHtml() or
//   highlightText().
// * Sign-in with the Amazon Cognito hosted UI (OAuth 2.0 authorization code
//   flow with PKCE), and an apiFetch() wrapper that sends the Cognito ID
//   token, which API Gateway's Cognito authorizer verifies on every call.
// * File downloads through short-lived presigned S3 URLs.
//
// Deployment settings come from config.js, which the deploy scripts generate
// from the stack outputs (scripts/deploy_helper.py render-web).
(function () {
    'use strict';

    // -------------------------------------------------------------------
    // Escaping
    // -------------------------------------------------------------------

    const HTML_ESCAPES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;'
    };

    /** Escape a value for safe use in HTML text or a quoted attribute. */
    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch]);
    }

    /** Escape a string so it matches literally inside a RegExp. */
    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Return escaped HTML for `value` with case-insensitive matches of
     * `term` wrapped in <mark>. Both the text and the matches are escaped,
     * and the search term is matched literally, not as a regular expression.
     */
    function highlightText(value, term) {
        const text = value === null || value === undefined ? '' : String(value);
        if (!term) {
            return escapeHtml(text);
        }
        const pattern = new RegExp(escapeRegExp(term), 'gi');
        let html = '';
        let last = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            html += escapeHtml(text.slice(last, match.index));
            html += '<mark>' + escapeHtml(match[0]) + '</mark>';
            last = match.index + match[0].length;
        }
        return html + escapeHtml(text.slice(last));
    }

    // -------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------

    const config = window.RFP_CONFIG || {};
    const STORAGE_KEY = 'rfp.tokens';
    const PKCE_KEY = 'rfp.pkce';
    const RETURN_KEY = 'rfp.returnTo';
    // Refresh the ID token this many seconds before it expires.
    const EXPIRY_MARGIN_SECONDS = 60;

    function redirectUri() {
        return window.location.origin + '/index.html';
    }

    function requireConfig() {
        const missing = ['apiUrl', 'cognitoDomain', 'clientId']
            .filter((name) => !config[name]);
        if (missing.length) {
            throw new Error('config.js is missing ' + missing.join(', ') +
                '. Deploy with scripts/deploy.sh or scripts/deploy.ps1.');
        }
    }

    // -------------------------------------------------------------------
    // Token storage. Tokens are kept in sessionStorage, so they are cleared
    // when the tab closes.
    // -------------------------------------------------------------------

    function base64UrlEncode(bytes) {
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function randomString(byteLength) {
        const bytes = new Uint8Array(byteLength);
        crypto.getRandomValues(bytes);
        return base64UrlEncode(bytes);
    }

    async function sha256(text) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return base64UrlEncode(new Uint8Array(digest));
    }

    /** Decode a JWT payload for display and expiry checks only. */
    function decodeJwt(token) {
        try {
            const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(payload).split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(json);
        } catch (error) {
            return {};
        }
    }

    function loadTokens() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null;
        } catch (error) {
            return null;
        }
    }

    function saveTokens(response, previous) {
        const tokens = {
            idToken: response.id_token,
            refreshToken: response.refresh_token || (previous && previous.refreshToken),
            expiresAt: decodeJwt(response.id_token).exp || 0
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
        return tokens;
    }

    function clearTokens() {
        sessionStorage.removeItem(STORAGE_KEY);
    }

    async function tokenRequest(params) {
        const response = await fetch(config.cognitoDomain + '/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params)
        });
        if (!response.ok) {
            throw new Error('Sign-in failed (HTTP ' + response.status + ')');
        }
        return response.json();
    }

    // -------------------------------------------------------------------
    // Sign-in flow
    // -------------------------------------------------------------------

    /** Redirect to the Cognito hosted UI. */
    async function login() {
        requireConfig();
        const verifier = randomString(64);
        const state = randomString(16);
        sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
        sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: redirectUri(),
            scope: 'openid email',
            state: state,
            code_challenge: await sha256(verifier),
            code_challenge_method: 'S256'
        });
        window.location.assign(config.cognitoDomain + '/oauth2/authorize?' + params.toString());
        // Never resolve: the page is navigating away.
        return new Promise(() => {});
    }

    /** Sign out locally and end the Cognito session. */
    function logout() {
        clearTokens();
        const params = new URLSearchParams({
            client_id: config.clientId,
            logout_uri: redirectUri()
        });
        window.location.assign(config.cognitoDomain + '/logout?' + params.toString());
    }

    /** Only allow returning to a page on this site after sign-in. */
    function safeReturnPath(path) {
        if (typeof path === 'string' && /^\/[A-Za-z0-9._-]*\.html(\?[^#]*)?$/.test(path)) {
            return path;
        }
        return '/index.html';
    }

    /** Complete the sign-in redirect if this page load carries a code. */
    async function handleRedirect() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
            throw new Error('Sign-in failed: ' + params.get('error'));
        }
        const code = params.get('code');
        if (!code) {
            return false;
        }
        const pkce = JSON.parse(sessionStorage.getItem(PKCE_KEY) || 'null');
        sessionStorage.removeItem(PKCE_KEY);
        if (!pkce || pkce.state !== params.get('state')) {
            throw new Error('Sign-in failed: state mismatch. Please try again.');
        }
        const response = await tokenRequest({
            grant_type: 'authorization_code',
            client_id: config.clientId,
            code: code,
            redirect_uri: redirectUri(),
            code_verifier: pkce.verifier
        });
        saveTokens(response, null);
        const returnTo = safeReturnPath(sessionStorage.getItem(RETURN_KEY));
        sessionStorage.removeItem(RETURN_KEY);
        if (returnTo !== '/index.html') {
            window.location.replace(returnTo);
            return new Promise(() => {});
        }
        window.history.replaceState({}, document.title, '/index.html');
        return true;
    }

    /** Return a valid ID token, refreshing it if needed, or null. */
    async function getIdToken() {
        const tokens = loadTokens();
        if (!tokens || !tokens.idToken) {
            return null;
        }
        const now = Math.floor(Date.now() / 1000);
        if (tokens.expiresAt - EXPIRY_MARGIN_SECONDS > now) {
            return tokens.idToken;
        }
        if (!tokens.refreshToken) {
            clearTokens();
            return null;
        }
        try {
            const response = await tokenRequest({
                grant_type: 'refresh_token',
                client_id: config.clientId,
                refresh_token: tokens.refreshToken
            });
            return saveTokens(response, tokens).idToken;
        } catch (error) {
            clearTokens();
            return null;
        }
    }

    function currentUserEmail() {
        const tokens = loadTokens();
        return tokens && tokens.idToken ? decodeJwt(tokens.idToken).email || '' : '';
    }

    /** Add the signed-in user's email and a sign-out button to the nav bar. */
    function renderUserMenu() {
        const nav = document.querySelector('.nav-links');
        if (!nav || nav.querySelector('.rfp-user-menu')) {
            return;
        }
        const menu = document.createElement('span');
        menu.className = 'rfp-user-menu';
        menu.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;margin-left:1rem;font-size:0.875rem;';
        const email = document.createElement('span');
        email.textContent = currentUserEmail();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nav-link';
        button.style.cssText = 'cursor:pointer;background:none;border:1px solid currentColor;';
        button.textContent = 'Sign out';
        button.addEventListener('click', logout);
        menu.append(email, button);
        nav.appendChild(menu);
    }

    function showFatalError(message) {
        const box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText = 'margin:2rem auto;max-width:640px;padding:1rem 1.5rem;border-radius:8px;' +
            'background:#fdecea;color:#611a15;font-family:sans-serif;';
        box.textContent = message;
        document.body.prepend(box);
    }

    let readyPromise = null;

    /**
     * Make sure the user is signed in, then return. Redirects to the hosted
     * UI when there is no valid session.
     */
    function requireAuth() {
        if (!readyPromise) {
            readyPromise = (async () => {
                requireConfig();
                await handleRedirect();
                if (!(await getIdToken())) {
                    await login();
                }
                renderUserMenu();
            })();
        }
        return readyPromise;
    }

    /** Run `main` once the user is signed in. */
    function onReady(main) {
        const start = () => requireAuth().then(main).catch((error) => {
            console.error(error);
            showFatalError(error.message);
        });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    // -------------------------------------------------------------------
    // API access
    // -------------------------------------------------------------------

    /** Call the API with the user's ID token. `path` starts with '/'. */
    async function apiFetch(path, options) {
        requireConfig();
        const token = await getIdToken();
        if (!token) {
            return login();
        }
        const init = Object.assign({}, options || {});
        init.headers = Object.assign({}, init.headers || {}, { Authorization: token });
        const response = await fetch(config.apiUrl + path, init);
        if (response.status === 401) {
            clearTokens();
            return login();
        }
        return response;
    }

    /** Call the API and parse the JSON response, throwing on errors. */
    async function apiJson(path, options) {
        const response = await apiFetch(path, options);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.error || body.message || ('HTTP ' + response.status));
        }
        return body;
    }

    /** Convert '/download/<prefix>/<file>' or '<file>' to an API path. */
    function downloadApiPath(linkOrName) {
        const value = String(linkOrName || '');
        if (value.startsWith('/download/')) {
            return value;
        }
        return '/download/' + value.split('/').map(encodeURIComponent).join('/');
    }

    /** Get a short-lived presigned URL for a pipeline file. */
    async function getDownloadUrl(linkOrName) {
        const body = await apiJson(downloadApiPath(linkOrName));
        return body.url;
    }

    /** Download a pipeline file through a presigned URL. */
    async function downloadFile(linkOrName) {
        const url = await getDownloadUrl(linkOrName);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    /** Fetch the text content of a pipeline file. */
    async function fetchFileText(linkOrName) {
        const response = await fetch(await getDownloadUrl(linkOrName));
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.text();
    }

    // Any element with data-download="<link>" downloads that file on click.
    document.addEventListener('click', (event) => {
        const target = event.target.closest ? event.target.closest('[data-download]') : null;
        if (!target) {
            return;
        }
        event.preventDefault();
        downloadFile(target.getAttribute('data-download')).catch((error) => {
            console.error('Download failed:', error);
            alert('Download failed: ' + error.message);
        });
    });

    window.RFP = Object.assign(window.RFP || {}, {
        config,
        escapeHtml,
        escapeRegExp,
        highlightText,
        requireAuth,
        onReady,
        login,
        logout,
        apiFetch,
        apiJson,
        downloadFile,
        fetchFileText,
        getDownloadUrl
    });
})();
