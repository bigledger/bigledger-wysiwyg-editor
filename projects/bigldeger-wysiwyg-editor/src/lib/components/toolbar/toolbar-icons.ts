const strokeIcon = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const fillIcon = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${body}</svg>`;

const toolbarIcons: Record<string, string> = {
  bold: strokeIcon('<path d="M7 5h6a4 4 0 1 1 0 8H7z"/><path d="M7 13h7a4 4 0 1 1 0 8H7z"/>'),
  italic: strokeIcon('<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>'),
  underline: strokeIcon('<path d="M7 4v7a5 5 0 0 0 10 0V4"/><line x1="5" y1="20" x2="19" y2="20"/>'),
  strikethrough: strokeIcon('<path d="M17 6c-1-1.3-2.8-2-5-2-3.6 0-5 1.9-5 4 0 6 10 2.1 10 8 0 2.2-1.8 4-5 4-2.2 0-4.1-.7-5.3-2"/><line x1="4" y1="12" x2="20" y2="12"/>'),
  subscript: strokeIcon('<path d="M4 6h8"/><path d="M8 6v11"/><path d="M5 17h6"/><path d="M16 15c0-1 .8-1.8 1.8-1.8h.4c1 0 1.8.8 1.8 1.8 0 1.9-4 1.8-4 3.8V19h4"/>'),
  superscript: strokeIcon('<path d="M4 6h8"/><path d="M8 6v11"/><path d="M5 17h6"/><path d="M16 5c0-1 .8-1.8 1.8-1.8h.4c1 0 1.8.8 1.8 1.8 0 1.9-4 1.8-4 3.8V9h4"/>'),
  quote: strokeIcon('<path d="M8 17c-1.9 0-3-1.3-3-3.2 0-2.2 1.5-4 4.2-4.9L10 10.8c-1.2.6-1.8 1.4-2 2.2H10V17H8z"/><path d="M16 17c-1.9 0-3-1.3-3-3.2 0-2.2 1.5-4 4.2-4.9l.8 1.9c-1.2.6-1.8 1.4-2 2.2H18V17h-2z"/>'),
  fontSize: strokeIcon('<polyline points="4 7 4 4 14 4 14 7"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="6" y1="20" x2="12" y2="20"/><polyline points="15 12 15 10 21 10 21 12"/><line x1="18" y1="10" x2="18" y2="20"/><line x1="16.5" y1="20" x2="19.5" y2="20"/>'),
  fontFamily: strokeIcon('<path d="M4 20L10 4l6 16"/><line x1="6.5" y1="14" x2="13.5" y2="14"/><path d="M16 18h4"/><path d="M18 18V9"/><path d="M16 9h5"/>'),
  fontColor: strokeIcon('<path d="M6 5h12"/><path d="M12 5v10"/><path d="M8 15h8"/><path d="M17.5 21a3.5 3.5 0 0 1-3.5-3.5c0-2.2 3.5-5.8 3.5-5.8s3.5 3.6 3.5 5.8A3.5 3.5 0 0 1 17.5 21z"/>'),
  backgroundColor: strokeIcon('<path d="M4 20h16"/><path d="M7 14l6-6 4 4-6 6H7z"/><path d="M13 8l4-4 3 3-4 4"/>'),
  justifyLeft: strokeIcon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="14" y2="10"/><line x1="4" y1="14" x2="18" y2="14"/><line x1="4" y1="18" x2="12" y2="18"/>'),
  justifyCenter: strokeIcon('<line x1="5" y1="6" x2="19" y2="6"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>'),
  justifyRight: strokeIcon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="10" y1="10" x2="20" y2="10"/><line x1="6" y1="14" x2="20" y2="14"/><line x1="12" y1="18" x2="20" y2="18"/>'),
  justifyFull: strokeIcon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/>'),
  insertUnorderedList: strokeIcon('<circle cx="5" cy="6" r="1.25"/><circle cx="5" cy="12" r="1.25"/><circle cx="5" cy="18" r="1.25"/><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/>'),
  insertOrderedList: strokeIcon('<line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><path d="M4 7h2V4"/><path d="M5 4v6"/><path d="M4 12c0-1.1.9-2 2-2s2 .9 2 2c0 2-4 2-4 4h4"/><path d="M4 16h2a2 2 0 1 1 0 4H4"/>'),
  indent: strokeIcon('<line x1="12" y1="6" x2="20" y2="6"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><polyline points="4 12 8 8 8 11 12 11 12 13 8 13 8 16 4 12"/>'),
  outdent: strokeIcon('<line x1="12" y1="6" x2="20" y2="6"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><polyline points="12 12 8 16 8 13 4 13 4 11 8 11 8 8 12 12"/>'),
  createLink: strokeIcon('<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07l-1.42 1.41"/><path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 1 0 7.07 7.08l1.41-1.42"/>'),
  unlink: strokeIcon('<path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41"/><path d="M5.5 18.5l1.41-1.4A5 5 0 0 1 14 17"/><path d="M4 4l16 16"/>'),
  insertImage: strokeIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5.5-5.5L7 19"/>'),
  insertVideo: strokeIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9"/><path d="M7 19l-2 2"/><path d="M17 19l2 2"/>'),
  insertTable: strokeIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/>'),
  removeFormat: strokeIcon('<path d="M5 5h14"/><path d="M9 5v11"/><path d="M7 16h4"/><path d="M5 19l14-14"/>'),
  fullscreen: strokeIcon('<path d="M8 4H4v4"/><path d="M16 4h4v4"/><path d="M20 16v4h-4"/><path d="M4 16v4h4"/>'),
  fullscreenExit: strokeIcon('<path d="M9 4H4v5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M4 15v5h5"/>'),
  code: strokeIcon('<polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/><line x1="13" y1="6" x2="11" y2="18"/>'),
  eye: strokeIcon('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>'),
  undo: strokeIcon('<path d="M9 7H4v5"/><path d="M4 12a8 8 0 1 1 2.3 5.7L4 15.4"/>'),
  redo: strokeIcon('<path d="M15 7h5v5"/><path d="M20 12a8 8 0 1 0-2.3 5.7l2.3-2.3"/>'),
  chevronDown: strokeIcon('<polyline points="6 9 12 15 18 9"/>'),
  check: strokeIcon('<polyline points="5 13 9 17 19 7"/>'),
  dialog: fillIcon('<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>'),
  moreText: strokeIcon('<path d="M3 20L10 4l7 16"/><line x1="6" y1="14" x2="14" y2="14"/><circle cx="20" cy="9" r="1.6" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="1.6" fill="currentColor" stroke="none"/>'),
  inlineClass: strokeIcon('<path d="M4 20L10 4l6 16"/><line x1="6.5" y1="14" x2="13.5" y2="14"/><rect x="15" y="8" width="7" height="6" rx="1.5" fill="none"/><line x1="17" y1="11" x2="20" y2="11"/>'),
  inlineStyle: strokeIcon('<path d="M3 20L9 4l6 16"/><line x1="5.5" y1="14" x2="12.5" y2="14"/><path d="M18.5 4l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="currentColor" stroke="none"/>'),

  // ── More Rich group icons ────────────────────────────────────────────────
  moreRich: strokeIcon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="6" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none"/>'),
  insertHR: strokeIcon('<line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>'),
  emoticons: strokeIcon('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none"/><path d="M8.5 15c1 1.5 5.5 1.5 7 0"/>'),
  insertBookmark: strokeIcon('<line x1="9" y1="3" x2="9" y2="21"/><path d="M9 3l8 4.5-8 4.5"/>'),
  specialCharacters: strokeIcon('<path d="M12 4c-2 0-5 1.5-5 5.5 0 2.5 1.5 4.5 4 5.5H7v2h10v-2h-4c2.5-1 4-3 4-5.5C17 5.5 14 4 12 4z"/><line x1="8" y1="21" x2="16" y2="21"/>'),
  embeds: strokeIcon('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="8.4" y1="10.9" x2="15.6" y2="6.1"/><line x1="8.4" y1="13.1" x2="15.6" y2="17.9"/>'),
  uploadFile: strokeIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="12 18 12 12"/><polyline points="9 15 12 12 15 15"/>')
};

toolbarIcons['link'] = toolbarIcons['createLink'];
toolbarIcons['image'] = toolbarIcons['insertImage'];
toolbarIcons['video'] = toolbarIcons['insertVideo'];
toolbarIcons['table'] = toolbarIcons['insertTable'];

export function getToolbarIconMarkup(icon?: string): string {
  if (!icon) {
    return '';
  }

  return toolbarIcons[icon] || icon;
}
