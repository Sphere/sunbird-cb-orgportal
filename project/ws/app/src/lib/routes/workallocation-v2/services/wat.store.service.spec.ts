import { WatStoreService } from './wat.store.service'

describe('WatStoreService', () => {
  let service: WatStoreService

  beforeEach(() => {
    service = new WatStoreService()
  })

  it('should set and get officerId', () => {
    service.setOfficerId = 'off-1'
    expect(service.getOfficerId).toBe('off-1')
  })

  it('should set and get workOrderId', () => {
    service.setworkOrderId = 'wo-1'
    expect(service.getworkOrderId).toBe('wo-1')
  })

  it('should emit activitiesGroup on setgetactivitiesGroup', done => {
    service.getactivitiesGroup.subscribe(val => {
      if (val.length) {
        expect(val).toEqual([{ groupName: 'g1' } as any])
        done()
      }
    })
    service.setgetactivitiesGroup([{ groupName: 'g1' } as any], true, true)
  })

  it('should emit competencyGroup and recompute competency list', done => {
    service.get_compGrp.subscribe(val => {
      if (val.length) {
        expect(val[0].compName).toBe('Comp1')
        done()
      }
    })
    service.setgetcompetencyGroup([
      { roleName: 'r1', competincies: [{ localId: 1, compName: 'Comp1' } as any] } as any,
    ])
  })

  it('should update comp group and read it by id', () => {
    service.updateCompGroup([{ localId: 1, compName: 'Comp1' } as any])
    expect(service.getUpdateCompGroupById(1)).toEqual({ localId: 1, compName: 'Comp1' })
    expect(service.getUpdateCompGroupById(99)).toBeUndefined()
  })

  it('should merge existing comp details in setCompGroup', done => {
    service.updateCompGroup([{ localId: 1, compName: 'Comp1', compLevel: 'L1' } as any])
    service.get_compGrp.subscribe(val => {
      if (val.length) {
        expect((val[0] as any).level).toBe('L1')
        done()
      }
    })
    service.setgetcompetencyGroup([
      { roleName: 'r1', competincies: [{ localId: 1, compName: 'Comp1' } as any] } as any,
    ])
  })

  it('should skip groups without competincies', () => {
    service.setgetcompetencyGroup([{ roleName: 'r1' } as any])
    expect(service.getcompetencyGroupValue).toEqual([{ roleName: 'r1' }])
  })

  it('should set and get officerGroup', done => {
    service.getOfficerGroup.subscribe(val => {
      if (val.length) {
        expect(val).toEqual([{ officerName: 'X' } as any])
        done()
      }
    })
    service.setOfficerGroup([{ officerName: 'X' } as any])
  })

  it('should set and get currentProgress', done => {
    service.getCurrentProgress.subscribe(val => {
      if (val === 50) {
        done()
      }
    })
    service.setCurrentProgress(50)
  })

  it('should set and get errorCount', done => {
    service.getErrorCount.subscribe(val => {
      if (val === 3) {
        done()
      }
    })
    service.setErrorCount(3)
  })

  it('should increment id on each call', () => {
    const first = service.getID
    const second = service.getID
    expect(second).toBe(first + 1)
  })

  it('should emit triggerSave', done => {
    service.triggerSave().subscribe(val => {
      expect(val).toEqual({ reload: false, serverCall: false })
      done()
    })
  })

  it('should clear all subjects', () => {
    service.setgetactivitiesGroup([{ groupName: 'g1' } as any])
    service.setCurrentProgress(10)
    service.setErrorCount(2)
    service.clear()
    expect(service.getCurrentProgress).toBeTruthy()
    service.getactivitiesGroup.subscribe(val => {
      expect(val).toEqual([])
    })
  })
})
