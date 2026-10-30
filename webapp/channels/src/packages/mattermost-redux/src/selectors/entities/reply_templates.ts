// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {GlobalState} from '@mattermost/types/store';

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {makeGetCategory} from 'mattermost-redux/selectors/entities/preferences';
import {parseReplyTemplate, REPLY_TEMPLATES_CATEGORY} from 'mattermost-redux/utils/reply_template_utils';
import type {ReplyTemplate} from 'mattermost-redux/utils/reply_template_utils';

const getReplyTemplatePreferences = makeGetCategory('getReplyTemplatePreferences', REPLY_TEMPLATES_CATEGORY);

export const getReplyTemplates: (state: GlobalState) => ReplyTemplate[] = createSelector(
    'getReplyTemplates',
    getReplyTemplatePreferences,
    (preferences) => {
        const templates: ReplyTemplate[] = [];

        for (const preference of preferences) {
            const template = parseReplyTemplate(preference.name, preference.value ?? '');
            if (template) {
                templates.push(template);
            }
        }

        return templates.sort((a, b) => (a.createAt - b.createAt) || a.id.localeCompare(b.id));
    },
);
