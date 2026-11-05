// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// Shared browser helpers for the RFP web UI.
//
// Every page renders data that comes from users or from the model (file
// names, answers, error messages, query string values). Any such value that
// is placed into innerHTML must go through escapeHtml() or highlightText().
(function () {
    'use strict';

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

    window.RFP = Object.assign(window.RFP || {}, {
        escapeHtml,
        escapeRegExp,
        highlightText
    });
})();
