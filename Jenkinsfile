#!/usr/bin/env groovy
@Library('cicdcommon@stable')
import com.att.eg.cicd.*


env.environment = 'dev-int'
env.platform = 'js-library'

def workflow = new WorkflowFactory().getWorkflow(env.platform, this)
workflow.create()
