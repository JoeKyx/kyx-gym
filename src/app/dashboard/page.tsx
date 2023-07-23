import MainNav from '@/components/navbar/MainNav';
import Heading from '@/components/text/Heading';

const page = () => {
  return (
    <>
      <MainNav />
      <div>
        <Heading size='default' className='md:text-center'>
          Welcome to Kyx Gym
        </Heading>
      </div>
    </>
  );
};

export default page;
