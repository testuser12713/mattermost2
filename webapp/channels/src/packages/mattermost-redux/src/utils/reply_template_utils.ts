// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Storage format of reply templates. It lives in mattermost-redux because the package is
// also built on its own and cannot import the webapp's utils; webapp code imports these
// names from 'utils/reply_templates', which re-exports them.

export type ReplyTemplate = {
    id: string;
    title: string;
    text: string;
    createAt: number;
};

export const REPLY_TEMPLATES_CATEGORY = 'reply_templates';
export const MAX_REPLY_TEMPLATES = 20;
export const MAX_REPLY_TEMPLATE_TITLE_LENGTH = 40;
export const MAX_REPLY_TEMPLATE_TEXT_LENGTH = 1000;

/**
 * Parses a stored preference value into a template. Returns null for anything that is
 * not valid JSON of shape {title: string, text: string, createAt: number}, or that
 * exceeds the length limits. Never throws.
 */
export function parseReplyTemplate(name: string, value: string): ReplyTemplate | null {
    if (typeof name !== 'string' || !name || typeof value !== 'string') {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
    }

    const {title, text, createAt} = parsed as Record<string, unknown>;
    if (typeof title !== 'string' || typeof text !== 'string' || typeof createAt !== 'number' || !Number.isFinite(createAt)) {
        return null;
    }

    if (!title.trim() || title.length > MAX_REPLY_TEMPLATE_TITLE_LENGTH) {
        return null;
    }
    if (!text || text.length > MAX_REPLY_TEMPLATE_TEXT_LENGTH) {
        return null;
    }

    return {id: name, title, text, createAt};
}
