import { useEffect, useState } from 'react';
import { CommentState } from '../../types';
import axios from 'axios';

const RenderComment = ({ comment }: { comment: CommentState }) => {
  const [commentedBy, setCommentedBy] = useState<string>(comment.commentedBy);

  useEffect(() => {
    axios
      .get<string>(`http://localhost:1437/api/user/${comment.commentedBy}`)
      .then(({ data }) => {
        setCommentedBy(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="mb-2 rounded-lg bg-white p-4 shadow-md">
      <p className="text-gray-700">{comment.comment}</p>
      <span className="text-sm text-gray-500">by {commentedBy}</span>
    </div>
  );
};

export default RenderComment;