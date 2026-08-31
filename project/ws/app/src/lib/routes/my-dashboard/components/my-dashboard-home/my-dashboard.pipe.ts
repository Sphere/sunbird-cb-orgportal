import { Pipe, PipeTransform } from '@angular/core'
import { SafeResourceUrl } from '@angular/platform-browser'
import { SanitizerService } from 'src/app/services/sanitizer.service'

@Pipe({
  standalone: false, name: 'safeUrl' })
export class SafeUrlPipe implements PipeTransform {
  constructor(private readonly sanitizerService: SanitizerService) { }

  transform(url: string): SafeResourceUrl {
    return this.sanitizerService.trustResourceUrl(url)
  }
}
