import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { VideoDialogComponent } from './video-dialog.component';

describe('VideoDialogComponent', () => {
  let component: VideoDialogComponent;
  let fixture: ComponentFixture<VideoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, VideoDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept valid YouTube URLs', () => {
    const control = component.videoForm.get('url');
    control?.setValue('https://youtu.be/dQw4w9WgXcQ');
    control?.markAsTouched();

    expect(control?.hasError('invalidVideoUrl')).toBeFalse();
  });

  it('should reject unsupported URLs', () => {
    const control = component.videoForm.get('url');
    control?.setValue('https://example.com/article');
    control?.markAsTouched();

    expect(control?.hasError('invalidVideoUrl')).toBeTrue();
  });

  it('should emit videoCreated with normalized form data', () => {
    spyOn(component.videoCreated, 'emit');
    spyOn(component, 'closeDialog');

    component.videoForm.patchValue({
      url: 'youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo video',
      width: 800,
      height: 450
    });

    component.onSubmit();

    expect(component.videoCreated.emit).toHaveBeenCalledWith({
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Demo video',
      width: 800,
      height: 450
    });
    expect(component.closeDialog).toHaveBeenCalled();
  });
});
