import { LightningElement } from 'lwc';

export default class Calculator extends LightningElement {
    numberButtons
    operationButtons
    equalsBtn
    deleteBtn
    allClearBtn
    prevText
    curtText = 0;
    useSecond = false; 
    renderedCallback(){
        this.numberButtons = this.template.querySelectorAll('[data-number]');
        this.operationButtons = this.template.querySelectorAll('[data-operation]')
    }

    numbInput(e){
        if(!this.useSecond){
            this.curtText = this.curtText === 0 ? '' :this.curtText;
            console.log(1, this.curtText)
            this.curtText += e.target.value;
            console.log(2, this.curtText)  
        }
        
    }

    handleBtn(e){
        this.operationButtons = e.target.value; 
        this.prevText = `${this.curtText} ${this.operationButtons}`
        this.curtText = 0;
    }

    calc(){
        let op = this.operationButtons;
        console.log('this op '+ op)
        switch (this.operationButtons) {
            case '+':
                this.curtText = Number(this.curtText) + Number(this.prevText);
                break;
            case '-':
                this.curtText = Number(this.curtText) - Number(this.prevText);
                break;
            case '*':
                this.curtText = Number(this.curtText) * Number(this.prevText);
                break;
            case '/':
                this.curtText = Number(this.curtText) / Number(this.prevText);
                break;
            default:
                break;
        }
    }
}