import { Injectable } from '@angular/core'
import { } from '@sunbird-cb/collection'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { UsersService } from '../services/users.service'
import { BaseUserResolve } from '../../home/resolvers/base-user-resolve'

@Injectable()
export class UserResolve extends BaseUserResolve {
  constructor(protected readonly usersSvc: UsersService, configSvc: ConfigurationsService) {
    super(configSvc)
  }
}
