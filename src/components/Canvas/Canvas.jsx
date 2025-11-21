import { useRef, useEffect, useState } from 'react';
import "./Canvas.css";
import { Stage, Layer} from 'react-konva';
import GraphNodes from './GraphNodes';

const Canvas = () => {

    const [nodes, setNodes] = useState([
    { id: 1, x: 150, y: 150 },
    { id: 2, x: 350, y: 250 },
  ]);

  const stageRef = useRef(null);
  const scrollInterval = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.7,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth *0.9,
        height: window.innerHeight * 0.7,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05;
    const handleWheel = (e) => {
      e.evt.preventDefault();

      const direction = e.evt.deltaY < 0 ? -1 : 1;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    };

    const handleDragStart = (e) => {
      scrollInterval.current = setInterval(() => {
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const target = e.target;
        const offset = 100;

        if (pos.x < offset) {
          stage.x(stage.x() + 2);
          target.x(target.x() - 2);
        }
        if (pos.x > stage.width() - offset) {
          stage.x(stage.x() - 2);
          target.x(target.x() + 2);
        }
        if (pos.y < offset) {
          stage.y(stage.y() + 2);
          target.y(target.y() - 2);
        }
        if (pos.y > stage.height() - offset) {
          stage.y(stage.y() - 2);
          target.y(target.y() + 2);
        }

        stage.batchDraw();
      }, 16);
    };

    const handleDragEnd = () => {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    };

    stage.on("wheel", handleWheel);
    stage.on("dragstart", handleDragStart);
    stage.on("dragend", handleDragEnd);

    return () => {
      stage.off("wheel", handleWheel);
      stage.off("dragstart", handleDragStart);
      stage.off("dragend", handleDragEnd);
      clearInterval(scrollInterval.current);
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <Stage
        ref={stageRef}
        className="stage"
        width={dimensions.width}
        height={dimensions.height}
        draggable
      >
        <Layer>
          <GraphNodes nodes={nodes} setNodes={setNodes} />
          
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;