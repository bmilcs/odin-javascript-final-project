import emptyStageImg from '@/assets/empty-stage.jpg';
import './MissingImg.scss';

type TProps = {
  className?: string;
  alt?: string;
};

function MissingImg({ alt, className }: TProps) {
  return <img src={emptyStageImg} className={`missing-image ${className}`} alt={alt} />;
}

export default MissingImg;
