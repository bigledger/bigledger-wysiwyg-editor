const strokeIcon = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const fillIcon = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${body}</svg>`;

const toolbarIcons: Record<string, string> = {
  bold: strokeIcon('<path d="M7 5h6a4 4 0 1 1 0 8H7z"/><path d="M7 13h7a4 4 0 1 1 0 8H7z"/>'),
  italic: strokeIcon('<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>'),
  underline: strokeIcon('<path d="M7 4v7a5 5 0 0 0 10 0V4"/><line x1="5" y1="20" x2="19" y2="20"/>'),
  strikethrough: strokeIcon('<path d="M17 6c-1-1.3-2.8-2-5-2-3.6 0-5 1.9-5 4 0 6 10 2.1 10 8 0 2.2-1.8 4-5 4-2.2 0-4.1-.7-5.3-2"/><line x1="4" y1="12" x2="20" y2="12"/>'),
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
  insertTable: strokeIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/>'),
  removeFormat: strokeIcon('<path d="M5 5h14"/><path d="M9 5v11"/><path d="M7 16h4"/><path d="M5 19l14-14"/>'),
  code: strokeIcon('<polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/><line x1="13" y1="6" x2="11" y2="18"/>'),
  eye: strokeIcon('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>'),
  undo: strokeIcon('<path d="M9 7H4v5"/><path d="M4 12a8 8 0 1 1 2.3 5.7L4 15.4"/>'),
  redo: strokeIcon('<path d="M15 7h5v5"/><path d="M20 12a8 8 0 1 0-2.3 5.7l2.3-2.3"/>'),
  chevronDown: strokeIcon('<polyline points="6 9 12 15 18 9"/>'),
  check: strokeIcon('<polyline points="5 13 9 17 19 7"/>'),
  dialog: fillIcon('<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>')
};

toolbarIcons['link'] = toolbarIcons['createLink'];
toolbarIcons['image'] = toolbarIcons['insertImage'];
toolbarIcons['table'] = toolbarIcons['insertTable'];

export function getToolbarIconMarkup(icon?: string): string {
  if (!icon) {
    return '';
  }

  return toolbarIcons[icon] || icon;
}
