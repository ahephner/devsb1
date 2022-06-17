@isTest
public class test_AttachLineItem2 {
    @isTest 
    static void test_AttachLineItem2() {
        //Create Account for Program
          Account acc = new Account(name = 'test acc');
  		  insert acc;
        //Create Program
        Program__c pro = new Program__c(name='test program', Account__c =acc.id);
        insert pro; 
        //Create area
        Area__c oArea = new Area__c();
        oArea.Name = 'Test Green';
        insert oArea;
        

        
        
        //Create Test ContentVersion
        ContentVersion oContentVersion = new ContentVersion();
        oContentVersion.Title = 'TestTitle';
        oContentVersion.PathOnClient = 'TestTitle.png';
        oContentVersion.VersionData = Blob.valueOf('Test Content');
        insert oContentVersion;
        
        //Get the contentDocId, just in case
        ContentVersion queryContentVersion = [Select Id, ContentDocumentId FROM ContentVersion Where Id =: oContentVersion.Id];
        
        Test.startTest();
        
        Test.setCurrentPage(Page.Attach_LineItem);
        Apexpages.currentPage().getParameters().put('id', oArea.Id);
        
        AttachPDFController2.savePDF_File(oArea.Id, pro.Id);
        
        Test.stopTest();
    }
}