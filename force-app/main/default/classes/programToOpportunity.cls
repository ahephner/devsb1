public with sharing class programToOpportunity {
	
    @auraEnabled
    public static string createOpp(string progId, list<string> appId){
        Date cd = System.today();
           system.debug(progId);
        Program__c program = [select account__c, name from Program__c where id =: progId];
       //record type id is not the same as PROD
        Opportunity opp = new Opportunity(Name=program.Name, AccountId = Program.Account__c, CloseDate= cd, StageName='Working', pricebook2id='01s410000077vSKAAY', recordtypeid='01275000000CgcYAAS');
        
        insert opp; 
        
        List<OpportunityLineItem> lines = new List<OpportunityLineItem>();
        
        for(string x: appId){
            system.debug(x);
        }
        return opp.Id; 
    } 
}