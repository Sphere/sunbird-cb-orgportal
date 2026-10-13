import { Injectable } from '@angular/core'
import { } from '@sunbird-cb/collection'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { UsersService } from '../services/users.service'
import { BaseWorkflowHistoryResolve } from '../../home/resolvers/base-workflow-history-resolve'

@Injectable()
export class WorkflowHistoryResolve extends BaseWorkflowHistoryResolve {
  constructor(protected readonly wfHistorySvc: UsersService, configSvc: ConfigurationsService) {
    super(configSvc)
  }
}
