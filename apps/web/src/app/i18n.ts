import i18next from "i18next";

void i18next.init({
	lng: "en",
	fallbackLng: "en",
	resources: {
		en: {
			translation: {
				editorTitle: "Standalone Editor",
			},
		},
		ja: {
			translation: {
				editorTitle: "スタンドアロンエディター",
			},
		},
		ko: {
			translation: {
				editorTitle: "독립형 에디터",
			},
		},
		"zh-CN": {
			translation: {
				editorTitle: "独立编辑器",
			},
		},
		"zh-TW": {
			translation: {
				editorTitle: "獨立編輯器",
			},
		},
	},
});

export { i18next };
