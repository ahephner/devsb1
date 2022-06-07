import { LightningElement } from 'lwc';

export default class Calculator extends LightningElement {
    numberButtons
    operationButtons
    equalsBtn
    deleteBtn
    allClearBtn
    prevText
    curtText
    renderedCallback(){
        this.numberButtons = this.template.querySelectorAll('[data-number]');
        this.operationButtons = this.template.querySelectorAll('[data-operation]')
    }

    check(){
        console.log(this.numberButtons)
    }
}