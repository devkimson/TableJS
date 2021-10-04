'use strict';

Date.prototype["format"] = function(str){
    let time = this;
    
    let y = time.getFullYear().toString();
    let M = (time.getMonth()+1).toString();
    let d = time.getDate().toString();
    let H = time.getHours().toString();
    let m = time.getMinutes().toString();
    let s = time.getSeconds().toString();
    let S = time.getMilliseconds().toString();

    return str.replace(/[yMdHmsS]+/gm, x=>{
        return eval(x.charAt()).slice(-x.length);
    });
}

const ks = {};

if(!ks.sort) ks.sort = {};

if(!ks.sort.editor) ks.sort.editor = (function(){

    function Controller(){
        let moduleModel = null;
        let uiElem = null;
        this.init = function(model, ui){
            moduleModel = model;
            uiElem = ui;
            
            uiElem.input.addEventListener('keydown', this.addRow);
            uiElem.readonly.addEventListener('click', moduleModel.isReadonly);
            uiElem.tbody.addEventListener('click', this.deleteRow);
            uiElem.sortBtnsWrap.addEventListener('click', this.btnHandler);
            uiElem.search.addEventListener('keyup', this.searchByWords);
        }

        this.addRow = function(ev){
            moduleModel.addRow(ev);
        }

        this.deleteRow = function(ev){
            let target = ev.target;

            if(target.tagName !== 'SPAN' || target.className.indexOf('del-btn')==-1) return;
            ev.preventDefault();

            let wrap = target.closest('[data-ks-sort]');
            let prt = wrap.querySelector('[data-ks-sort-idx]');
            wrap.classList.add("del");

            setTimeout(()=>{
                moduleModel.deleteRow({idx:prt.dataset.ksSortIdx, text:prt.nextElementSibling.innerText});
            }, 500);
        }

        this.btnHandler = function(ev){
            moduleModel.btnHandler(ev);
        }

        this.searchByWords = function(ev){
            moduleModel.searchByWords(ev);
        }
    }

    function Model(){
        let moduleView = null;
        let rows = null;
        let readonly = null;

        this.init = function(view){
            moduleView = view;
            this.getRowsFromLocalStorage();
            this.updateTable();
        }

        this.searchByWords = function(ev){
            moduleView.searchByWords(ev, rows);
        }

        this.getRowsFromLocalStorage = function(){
            rows = localStorage.rows?JSON.parse(localStorage.rows):[];
        }

        this.setRowsToLocalStorage = function(){
            localStorage.rows = JSON.stringify(rows);
        }

        this.updateTable = function(){
            moduleView.updateTable(rows);
            this.setRowsToLocalStorage();
        }

        this.isReadonly = function(){
            readonly = !readonly;
            moduleView.isReadonly(readonly);
        }
        
        this.addRow = function(ev){
            // 보류 - 채택
            let rowForm = (row) => {
                let max = 0;
                rows.forEach(x=>{
                    max = x.idx>max?x.idx:max;
                });
                return {idx: max+1, row: row, regdate: new Date().getTime()}
            };
            let target = ev.target;

            if(ev.key === 'Enter'){
                rows.push(rowForm(target.value));
                moduleView.clearInput();
                this.updateTable();
            }
        }

        this.deleteRow = function(row){
            rows = rows.filter(r=>r.idx!=row.idx);
            this.updateTable();
        }

        this.btnHandler = function(ev){
            let target = ev.target;
            let text = target.innerText;

            text = text.charAt().toUpperCase()+text.slice(1);
            
            if(target.className.indexOf('btns-')==-1 || target.tagName !== 'BUTTON') return;

            ev.preventDefault();
            eval(`this.align${text}(rows);`);
        }

        this.alignClear = function(){
            if(confirm("Delete the entire row.\nDeleted rows cannot be recovered.")){
                rows = rows.filter(r=> false);
                this.updateTable();
            }
        }

        this.alignSort = function(rows){
            for(let i in rows){
                for(let q in rows){
                    if(rows[i].idx < rows[q].idx){
                        let tmp = rows[i];
                        rows[i] = rows[q];
                        rows[q] = tmp;
                    }
                }
            }
            this.updateTable(rows);
        }

        this.alignReverse = function(rows){
            for(let i in rows){
                for(let q in rows){
                    if(rows[i].idx > rows[q].idx){
                        let tmp = rows[i];
                        rows[i] = rows[q];
                        rows[q] = tmp;
                    }
                }
            }
            moduleView.updateTable(rows);
        }
    }

    function View(){
        let uiElem = null;

        this.init = function(ui){
            uiElem = ui;
        }

        this.searchByWords = function(ev, rows){
            let value = ev.target.value;
            let search = rows;
            if(value.length>0){
                search = rows.filter(x=>x.row.indexOf(value)>-1);
            }
            this.updateTable(search);
        }

        this.updateTable = function(rows){
            let reverse = false;
            let formedRows = '';
            let id = 1;

            if(rows.length>0 && rows[0].idx>rows[rows.length-1].idx){
                reverse = true;
                id = rows.length;
            }

            let rowForm = row => `
                    <tr data-ks-sort="tr" ${rows[rows.length-1]==row?"class='select'":""}>
                        <td data-ks-sort="index" data-ks-sort-idx="${row.idx}">${reverse?id--:id++}</td>
                        <td>${row.row}</td>
                        <td data-ks-sort="time">
                            <time>
                                ${new Date(row.regdate).format("yyyy-MM-dd HH:mm:ss")}
                            </time>
                        </td>
                        <td><span class="del-btn ks-sort">&times;</span></td>
                    </tr>
            `;

            rows.forEach(row=>formedRows += rowForm(row));
            uiElem.tbody.innerHTML = formedRows;
        }

        this.isReadonly = function(readonly){
            uiElem.search.disabled = readonly;
            uiElem.input.disabled = readonly;
            uiElem.wrap.classList.toggle('readonly');
        }

        this.clearInput = function(){
            uiElem.input.value = '';
        }
    }

    function Generator(){
        let uiElem = null;
        let attr = {};

        this.init = function(attributes){
            attr = attributes;
            uiElem = document.querySelector('[data-ks-sort="table"]');
            if(!uiElem){
                let tb = document.querySelector('table');
                let tf = confirm("Would you make current exists table to ks sort table?");
                tf?tb.dataset.ksSort = 'table':console.error("Please make a table that have ks sort data.");
                
                if(tf) {
                    uiElem = tb;
                    this.createAllParts();
                    return true;
                } else return false;
            } else {
                this.createAllParts();
                return true;
            }
        }

        this.generateTh = function(parent){
            let max = 0;
            for(let i of Object.values(attr['column'])){
                if(i!=undefined)
                    max = Math.max(max, i.length);
            }
            return attr['column'][parent]?attr['column'][parent].map(x=>`<th${attr['column'][parent].length==1 && max!=0?' colspan="'+max+'"':''}>${x}</th>`):`<th colspan="${max}">No Value</th>`;
        }

        this.generateTd = function(parent){
            let max = 0;
            for(let i of Object.values(attr['column'])){
                if(i!=undefined)
                    max = Math.max(max, i.length);
            }
            return attr['column'][parent]?attr['column'][parent].map(x=>`<td${attr['column'][parent].length==1 && max!=0?' colspan="'+max+'"':''}>${x}</td>`):`<td colspan="${max}">No Value</td>`;
        }

        this.createSortBtnsPart = function(){
            let sortBtnsWrap = document.createElement('div');
            let sort = document.createElement('button');
            let reverse = document.createElement('button');
            let clear = document.createElement('button');
            let hide = document.createElement('button');

            Object.assign(sortBtnsWrap,{
                className: "ks-sort ks-sort-green btns-wrap",
                type: "button",
            });
            Object.assign(sort,{
                className: "ks-sort ks-sort-green btns-sort",
                innerText: 'sort',
                type: "button",
            });
            Object.assign(reverse,{
                className: "ks-sort ks-sort-green btns-reverse",
                innerText: 'reverse',
                type: "button",
            });
            Object.assign(clear,{
                className: "ks-sort ks-sort-green btns-clear",
                innerText: 'clear',
                type: "button",
            });
            Object.assign(hide,{
                className: "ks-sort ks-sort-green btns-hide",
                innerText: 'hide',
                type: "button",
            });

            sortBtnsWrap.append(sort, reverse, clear, hide);

            return sortBtnsWrap;
        }

        this.createSeachPart = function(){
            let search = document.createElement('input');
            let searchBtn = document.createElement('button');
            

            Object.assign(search,{
                className: "search-bar ks-sort",
                type: "text",
            });
            Object.assign(searchBtn,{
                className: "search-btn ks-sort ks-sort-main",
                innerText: "search",
                type: "button",
            });
            return [search, searchBtn];
        }

        this.createAllParts = function(){
            let dom = new DOMParser();
            let div = uiElem.insertAdjacentElement('beforeBegin', document.createElement('div'));
            let searchWrap = div.cloneNode();
            let elements = dom.parseFromString(`
            <table>
                <thead data-ks-sort="head">
                    <tr data-ks-sort="tr">
                        ${this.generateTh('head')}
                    </tr>
                </thead>
                <tbody data-ks-sort="body">
                    <tr>
                        ${this.generateTd('body')}
                    </tr>
                </tbody>
                <tfoot data-ks-sort="foot">
                    <tr data-ks-sort="tr">
                        ${this.generateTd('foot')}
                    </tr>
                    <tr data-ks-sort="tr">
                        <td>
                            <input id="readonly" type="checkbox" class="readonly ks-sort">
                            <label for="readonly">readonly</label>
                        </td>
                    </tr>
                </tfoot>
            </table>
            `, 'text/html')
            .querySelector('table').innerHTML;

            uiElem.innerHTML = `${elements}`;

            div.dataset.ksSort = 'wrap';
            div.append(uiElem);
            div.append(new DOMParser().parseFromString(`<div class="input">
            <input class="ks-sort" type="text" data-ks-sort="input" placeholder="내용 등록">
            </div>`,'text/html').querySelector('div'));
            
            div.prepend(this.createSortBtnsPart());
            searchWrap.prepend(...this.createSeachPart());
            searchWrap.classList.add("search-wrap");
            div.prepend(searchWrap);
        }
    }

    return {

        init: function(attributes){
            const attr = attributes || {
                column: {
                    head: [
                        "구분",
                        "내용",
                        "생성시간",
                        "비고"
                    ],
                    foot: [
                        "made by kimson"
                    ]
                }
            };
            if(this.checkValid(attr)){
                const body = document.body;
                const wrap = document.querySelector('[data-ks-sort="wrap"]');
                const search = document.querySelector('.search-bar');
                const searchBtn = document.querySelector('.search-btn');
                const input = document.querySelector('[data-ks-sort="input"]');
                const tb = document.querySelector('[data-ks-sort="table"]');
                const thead = document.querySelector('[data-ks-sort="head"]');
                const tbody = document.querySelector('[data-ks-sort="body"]');
                const tfoot = document.querySelector('[data-ks-sort="foot"]');
                const sortBtnsWrap = document.querySelector('.btns-wrap');
                const sort = document.querySelector('.btns-sort');
                const reverse = document.querySelector('.btns-reverse');
                const clear = document.querySelector('.btns-clear');
                const hide = document.querySelector('.btns-hide');
                const readonly = document.querySelector('.readonly');
                
                const ui = {
                    body,
                    wrap,
                    search,
                    searchBtn,
                    input,
                    tb,
                    thead,
                    tbody,
                    tfoot,
                    sortBtnsWrap,
                    sort,
                    reverse,
                    clear,
                    hide,
                    readonly,
                }
    
                const view = new View();
                const model = new Model();
                const controller = new Controller();
    
                view.init(ui);
                model.init(view);
                controller.init(model, ui);
            }
        },
        checkValid: function(attributes){
            const gt = new Generator();
            return gt.init(attributes);
        }

    }
})();