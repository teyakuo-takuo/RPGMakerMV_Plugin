// ==============================================================================
// Teya_DetailDescription.js
// ------------------------------------------------------------------------------
// Copyright (c) 2020 takuo
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
// ------------------------------------------------------------------------------
// Version
// 1.0.0 2020/04/19 初版
// 制作 RPGツクールMV Ver1.6.2準拠
// ==============================================================================

/*:
 * @plugindesc Ver1.0.0 アイテムやスキルの詳細な説明文を表示するウィンドウ機能を追加します。
 *
 * @author takuo
 * @license MIT
 *
 * @param WindowOpenKey
 * @text ウィンドウ開閉キー番号
 * @dsec アイテム詳細ウィンドウを開くための入力キーを番号で指定
 * 初期値：65
 * @default 65
 * @type number
 *
 * @param secretItemA
 * @text 隠しアイテムＡ名
 * @desc 隠しアイテムＡのタイプ名
 * 初期値: 隠しアイテムＡ
 * @default 隠しアイテムＡ
 * @type string
 *
 * @param secretItemB
 * @text 隠しアイテム名Ｂ
 * @desc 隠しアイテムＢのタイプ名
 * 初期値: 隠しアイテムＢ
 * @default 隠しアイテムＢ
 * @type string
 *
 * @param detailTextTagName
 * @text 詳細説明テキストタグ
 * @desc 詳細説明の本文テキストを記入するノートタグの名前
 * 初期値: 詳細説明テキスト
 * @default 詳細説明テキスト
 * @type string
 *
 * @param detailTypeTagName
 * @text 詳細分類ワードタグ
 * @desc 詳細説明の分類名を記入するノートタグの名前
 * 初期値: 詳細分類ワード
 * @default 詳細分類ワード
 * @type string
 *
 * @param secretTextType
 * @text 非表示テキストの扱い方
 * @desc 詳細表示スイッチの効果で非表示になる本文テキストをどう扱うか
 * @default 1
 * @type serect
 *
 * @option 省略
 * @value 1
 * @option 置換
 * @value 2
 * @option 掲示
 * @value 3
 *
 * @param soundEffect
 * @text ウィンドウ効果音
 * @desc ウィンドウ開閉時に再生される効果音情報
 * ※音量0でもよいので何らかのSEを入力すること
 * @default
 * @type struct<SE>
 *
 * @help --参考/改変/引用元（敬称略）--
 * 星潟、tomoaky、トリアコンタン
 *
 * アイテムやスキルの詳細な説明を表示する機能を追加します。
 *
 * このプラグインを導入することで、
 * アイテム画面や装備画面でアイテムにカーソルを合わせた状態で特定のキーを押した際、
 * アイテム詳細説明ウィンドウを開く事が出来るようになります。
 * 詳細説明の記述には制御文字を使用する事が出来ます。
 * ==============================================================================
 * スキル・アイテム・武器・防具のメモ欄に指定。
 * <詳細説明テキスト:xxxx>の形でメモ欄に記入すると詳細説明ウィンドウで説明文として表示され、
 * <詳細分類ワード:xxxx>の形でメモ欄に記入すると詳細説明ウィンドウの中でのみその対象の分類が記入された文字列に変化します。
 * ------------------------------------------------------------------------------
 * 例.
 * <詳細分類ワード:軽い斧>
 * <詳細説明テキスト:あいうえお
 * かきくけこ
 * さしすせそ
 * \C[10]たちつてと
 *
 * なにぬねの
 * はひふへほ>
 *
 * この場合、ハンドアクスの詳細説明は以下のように表示されます。
 *
 * [ハンドアクスのアイコン]ハンドアクス             軽い斧
 * ハンドアクスの通常のアイテム説明1行目
 * ハンドアクスの通常のアイテム説明2行目
 * あいうえお
 * かきくけこ
 * さしすせそ
 * たちつてと（赤字で表示）
 *
 * なにぬねの
 * はひふへほ
 *
 * このプラグインにはプラグインコマンドはありません。
 */

/*~struct~SE:
 * @param name
 * @desc SEのファイル名称
 * @default Book1
 * @require 1
 * @dir audio/se/
 * @type file
 *
 * @param volume
 * @desc SEのボリューム
 * @default 90
 * @type number
 * @min 0
 * @max 100
 *
 * @param pitch
 * @desc SEのピッチ
 * @default 100
 * @type number
 * @min 50
 * @max 150
 *
 * @param pan
 * @desc SEの左右バランス
 * @default 0
 * @type number
 * @min -100
 * @max 100
 */

(function () {
    'use strict';
    const PLUGIN_NAME = 'Teya_DetailDescription';

    //=============================================================================
    // 静的ローカル関数・定数パラメータの定義
    //=============================================================================
    class LocalManager {
        constructor() {
            throw new Error('This is a static class');
        }

        // プラグインパラメータやプラグインコマンドパラメータの整形・チェック
        static createPluginParameter(pluginName) {
            const replaceValue = (key, value) => {
                if (value === 'null' || (value[0] === '"' && value[value.length - 1] === '"')) {
                    return value;
                }
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            };
            const parameter = JSON.parse(JSON.stringify(PluginManager.parameters(pluginName), replaceValue));
            PluginManager.setParameters(pluginName, parameter);
            return parameter;
        }
    }

    const PLUGIN_PARAM = LocalManager.createPluginParameter(PLUGIN_NAME);
    Input.keyMapper[PLUGIN_PARAM.WindowOpenKey] = 'detailDescriptionWindowOpenKey';

    //=============================================================================
    // Game_System
    //=============================================================================
    Game_System.prototype.initDetailDescriptionWindowSeIfNeed = function () {
        if (!this._DetailDescriptionWindowSe) {
            this._DetailDescriptionWindowSe = this.createSe(PLUGIN_PARAM.soundEffect);
        }
    };

    Game_System.prototype.createSe = function (se) {
        se.volume = parseInt(se.volume);
        se.pitch = parseInt(se.pitch);
        se.pan = parseInt(se.pan);
        return se;
    };

    Game_System.prototype.getDetailDescriptionWindowSe = function () {
        this.initDetailDescriptionWindowSeIfNeed();
        return this._DetailDescriptionWindowSe;
    };

    //=============================================================================
    // Window
    //=============================================================================
    const _Window_Selectable_processHandling = Window_Selectable.prototype.processHandling;
    Window_Selectable.prototype.processHandling = function () {
        if (this.isOpenAndActive() && this.isHandled('detailDescriptionWindowOpenKey') && this.isDescriptionTriggered()) {
            this.processDescription();
        } else {
            _Window_Selectable_processHandling.call(this);
        }
    };

    Window_Selectable.prototype.isDescriptionTriggered = function (wx, wy) {
        if (this._helpWindow && TouchInput.isTriggered()) {
            wx = (Graphics.width - Graphics.boxWidth) / 2 + this._helpWindow.x;
            wy = (Graphics.height - Graphics.boxHeight) / 2 + this._helpWindow.y;
            return TouchInput.x >= wx && TouchInput.x < wx + this._helpWindow.width && TouchInput.y >= wy && TouchInput.y < wy + this._helpWindow.height;
        }
        return Input.isRepeated('detailDescriptionWindowOpenKey');
    };

    Window_Selectable.prototype.processDescription = function () {
        if (this.isCurrentItemDescriptionEnabled()) {
            AudioManager.playStaticSe($gameSystem.getDetailDescriptionWindowSe());
            this.updateInputData();
            this.deactivate();
            if (this.isHandled('detailDescriptionWindowOpenKey')) {
                this._handlers['detailDescriptionWindowOpenKey'](this);
            }
        } else {
            this.playBuzzerSound();
        }
    };

    Window_Selectable.prototype.isCurrentItemDescriptionEnabled = function () {
        return true;
    };

    Window_ItemList.prototype.isCurrentItemDescriptionEnabled = function () {
        return this.item();
    };

    Window_SkillList.prototype.isCurrentItemDescriptionEnabled = function () {
        return this.item();
    };

    Window_EquipSlot.prototype.isCurrentItemDescriptionEnabled = function () {
        return this.item();
    };

    Window_ShopBuy.prototype.isCurrentItemDescriptionEnabled = function () {
        return this.item();
    };

    Window_Message.prototype.setDetailDescriptionWindow = function (detailDescriptionWindow) {
        this._detailDescriptionWindow = detailDescriptionWindow;
    };

    const _Window_Message_isAnySubWindowActive = Window_Message.prototype.isAnySubWindowActive;
    Window_Message.prototype.isAnySubWindowActive = function () {
        return _Window_Message_isAnySubWindowActive.call(this) || this._detailDescriptionWindow.active;
    };

    //-----------------------------------------------------------------------------
    // Window_DetailDescription
    //-----------------------------------------------------------------------------
    function Window_DetailDescription(...args) {
        this.initialize(args);
    }

    Window_DetailDescription.prototype = Object.create(Window_Selectable.prototype);
    Window_DetailDescription.prototype.constructor = Window_DetailDescription;

    Window_DetailDescription.prototype.initialize = function () {
        Window_Selectable.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
        this.openness = 0;
    };

    Window_DetailDescription.prototype.setItem = function (item) {
        if (this._item !== item) {
            this._item = item;
            this.contents.clear();
            if (this._item) {
                this.drawItemName(this._item, 0, 0);
                this.drawDescriptionType(this._item.meta[PLUGIN_PARAM.detailTypeTagName], 0, 0);
                this.drawDescriptionProfile(this._item.description, 0, this.lineHeight() * 1);
                this.drawDetailText(this._item.meta[PLUGIN_PARAM.detailTextTagName], 0, this.lineHeight() * 3);
            }
        }
    };

    Window_DetailDescription.prototype.drawDescriptionType = function (text, x, y) {
        if (!this._item.meta[PLUGIN_PARAM.detailTypeTagName]) {
            if (DataManager.isItem(this._item)) {
                switch (this._item.itypeId) {
                    case 1:
                        text = TextManager.item;
                        break;
                    case 2:
                        text = TextManager.keyItem;
                        break;
                    case 3:
                        text = PLUGIN_PARAM.secretItemA;
                        break;
                    case 4:
                        text = PLUGIN_PARAM.secretItemB;
                        break;
                }
            } else if (DataManager.isWeapon(this._item)) {
                text = $dataSystem.weaponTypes[this._item.wtypeId];
            } else if (DataManager.isArmor(this._item)) {
                text = $dataSystem.armorTypes[this._item.atypeId];
            } else if (DataManager.isSkill(this._item)) {
                text = $dataSystem.skillTypes[this._item.stypeId];
            }
        }
        this.changeTextColor(this.systemColor());
        this.drawText(text, x, y, this.contents.width - this.textPadding(), 'right');
        this.resetTextColor();
    };

    Window_DetailDescription.prototype.drawDescriptionProfile = function (text, x, y) {
        this.drawTextEx(text, x + this.textPadding(), y);
    };

    Window_DetailDescription.prototype.drawDetailText = function (text, x, y) {
        if (text) {
            text = text.split(/\r\n|\r|\n/);
            text.forEach((value, index) => {
                if (text[index] !== '') {
                    this.drawTextEx(text[index], x + this.textPadding(), y);
                }
                y += this.lineHeight();
            });
            this.resetTextColor();
        }
        return y;
    };

    //=============================================================================
    // Scene
    //=============================================================================
    Scene_Base.prototype.createDetailDescriptionWindow = function () {
        this._detailDescriptionWindow = new Window_DetailDescription();
        this._detailDescriptionWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionClose.bind(this));
        this._detailDescriptionWindow.setHandler('cancel', this.descriptionClose.bind(this));
        this.addWindow(this._detailDescriptionWindow);
    };

    Scene_Base.prototype.descriptionOpen = function (mainWindow) {
        this._descriptionMainWindow = mainWindow;
        this._detailDescriptionWindow.setItem(this._descriptionMainWindow.item());
        this._detailDescriptionWindow.open();
        this._detailDescriptionWindow.activate();
    };

    Scene_Base.prototype.descriptionClose = function () {
        this._detailDescriptionWindow.close();
        this._descriptionMainWindow.activate();
    };

    const _Scene_Map_createMessageWindow = Scene_Map.prototype.createMessageWindow;
    Scene_Map.prototype.createMessageWindow = function () {
        _Scene_Map_createMessageWindow.call(this);
        this._messageWindow._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
        this._messageWindow.setDetailDescriptionWindow(this._detailDescriptionWindow);
    };

    const _Scene_Item_createItemWindow = Scene_Item.prototype.createItemWindow;
    Scene_Item.prototype.createItemWindow = function () {
        _Scene_Item_createItemWindow.call(this);
        this._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
    };

    const _Scene_Skill_createItemWindow = Scene_Skill.prototype.createItemWindow;
    Scene_Skill.prototype.createItemWindow = function () {
        _Scene_Skill_createItemWindow.call(this);
        this._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
    };

    const _Scene_Equip_createItemWindow = Scene_Equip.prototype.createItemWindow;
    Scene_Equip.prototype.createItemWindow = function () {
        _Scene_Equip_createItemWindow.call(this);
        this._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
    };

    const _Scene_Equip_createSlotWindow = Scene_Equip.prototype.createSlotWindow;
    Scene_Equip.prototype.createSlotWindow = function () {
        _Scene_Equip_createSlotWindow.call(this);
        this._slotWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
    };

    const _Scene_Shop_createBuyWindow = Scene_Shop.prototype.createBuyWindow;
    Scene_Shop.prototype.createBuyWindow = function () {
        _Scene_Shop_createBuyWindow.call(this);
        this._buyWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
    };

    const _Scene_Shop_createSellWindow = Scene_Shop.prototype.createSellWindow;
    Scene_Shop.prototype.createSellWindow = function () {
        _Scene_Shop_createSellWindow.call(this);
        this._sellWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
    };

    const _Scene_Shop_descriptionOpen = Scene_Shop.prototype.descriptionOpen;
    Scene_Shop.prototype.descriptionOpen = function (mainWindow) {
        _Scene_Shop_descriptionOpen.call(this, mainWindow);
    };

    const _Scene_Shop_descriptionClose = Scene_Shop.prototype.descriptionClose;
    Scene_Shop.prototype.descriptionClose = function () {
        _Scene_Shop_descriptionClose.call(this);
    };

    const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function () {
        return _Scene_Battle_isAnyInputWindowActive.call(this) || this._detailDescriptionWindow.active;
    };

    const _Scene_Battle_createSkillWindow = Scene_Battle.prototype.createSkillWindow;
    Scene_Battle.prototype.createSkillWindow = function () {
        _Scene_Battle_createSkillWindow.call(this);
        this._skillWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
    };

    const _Scene_Battle_createItemWindow = Scene_Battle.prototype.createItemWindow;
    Scene_Battle.prototype.createItemWindow = function () {
        _Scene_Battle_createItemWindow.call(this);
        this._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
    };

    const _Scene_Battle_createMessageWindow = Scene_Battle.prototype.createMessageWindow;
    Scene_Battle.prototype.createMessageWindow = function () {
        _Scene_Battle_createMessageWindow.call(this);
        this._messageWindow._itemWindow.setHandler('detailDescriptionWindowOpenKey', this.descriptionOpen.bind(this));
        this.createDetailDescriptionWindow();
        this._messageWindow.setDetailDescriptionWindow(this._detailDescriptionWindow);
    };
})();
