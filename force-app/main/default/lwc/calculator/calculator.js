import { LightningElement } from 'lwc';

export default class Calculator extends LightningElement {
    numberButtons
    operationButtons
    equalsBtn
    deleteBtn
    allClearBtn
    prevText
    prevNumb;
    curtText = 0;
    useSecond = false; 
    eventListening; 
    // renderedCallback(){
    //     this.numberButtons = this.template.querySelectorAll('[data-number]');
    //     this.operationButtons = this.template.querySelectorAll('[data-operation]')
    // }
    // connectedCallback(){
    //     this.startEventListener(); 
    // }
    // startEventListener(){
    //     if(!this.eventListening){
    //         console.log('listening')
    //         window.addEventListener('keydown', this.watchKeyDown,{
    //             once:false,
    //         }) 
    //         this.eventListening = true; 
    //     }
    // }
    // watchKeyDown = (event) => {
    //     let key = event.key; 
    //     console.log({key})
    //  }

    // endEventListener(){
    //     this.eventListening = false; 
    //     window.removeEventListener('keydown', this.watchKeyDown);
    // }
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
        console.log(this.operationButtons)
        this.prevText = `${this.curtText} ${this.operationButtons}`
        this.prevNumb = Number(this.curtText)
        this.curtText = 0;
    }
    del(){
        this.curtText = this.curtText.length > 0 ? this.curtText.substring(0, this.curtText.length-1) : 0; 
    }
    calc(){
        let op = this.operationButtons;
        //this.prevText = this.prevText.substring(0, this.prevText.length - 2)
        console.log(typeof this.prevNumb);
        
        switch (op) {
            case '+':
                this.curtText = Number(this.curtText) + Number(this.prevNumb);
                this.prevText = this.curtText;
                this.prevNumb = this.curtText;
                break;
            case '-':
                console.log(1, this.curtText, 2, this.prevNumb)
                this.curtText = Number(this.prevNumb) - Number(this.curtText);
                this.prevText = this.curtText;
                this.prevNumb = this.curtText;
                break;
            case '*':
                this.curtText = Number(this.curtText) * Number(this.prevNumb);
                this.prevText = this.curtText;
                this.prevNumb = this.curtText;
                break;
            case '/':

                this.curtText = Number(this.prevNumb) / Number(this.curtText);
                this.prevText = this.curtText;
                this.prevNumb = this.curtText;
                break;
            default:
                break;
        }
    }

    clear(){
        console.log('clear');
        
        this.curtText = 0;
        this.prevText = '';
        this.prevNumb = 0;
        this.operationButtons = ''; 
    }
}